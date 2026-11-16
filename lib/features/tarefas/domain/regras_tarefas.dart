import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/utils/datas.dart';
import '../../../core/utils/texto.dart';
import 'tarefa.dart';

/// Máximo de tarefas criadas numa única confirmação vinda do chat.
const int limiteTarefasPorChamadaChat = 3;

/// Uma tarefa está atrasada quando tem data anterior a hoje e não foi concluída.
bool estaAtrasada(Tarefa tarefa, DateTime hoje) {
  final vencimento = tarefa.dataVencimento;
  if (tarefa.concluida || vencimento == null) return false;
  return vencimento.isBefore(inicioDoDia(hoje));
}

/// Tarefas separadas por seção da tela, na ordem de exibição.
class GruposTarefas {
  const GruposTarefas({
    required this.atrasadas,
    required this.hoje,
    required this.proximas,
    required this.semData,
    required this.concluidas,
  });

  final List<Tarefa> atrasadas;
  final List<Tarefa> hoje;

  /// Pendentes com data futura, agrupadas pela chave `yyyy-MM-dd` em ordem crescente.
  final Map<String, List<Tarefa>> proximas;
  final List<Tarefa> semData;
  final List<Tarefa> concluidas;

  bool get temPendentes =>
      atrasadas.isNotEmpty ||
      hoje.isNotEmpty ||
      proximas.isNotEmpty ||
      semData.isNotEmpty;
}

GruposTarefas agruparTarefas(List<Tarefa> tarefas, DateTime hoje) {
  final hojeInicio = inicioDoDia(hoje);
  final atrasadas = <Tarefa>[];
  final doDia = <Tarefa>[];
  final porDia = <String, List<Tarefa>>{};
  final semData = <Tarefa>[];
  final concluidas = <Tarefa>[];

  for (final tarefa in tarefas) {
    if (tarefa.concluida) {
      concluidas.add(tarefa);
      continue;
    }
    final vencimento = tarefa.dataVencimento;
    if (vencimento == null) {
      semData.add(tarefa);
    } else if (vencimento.isBefore(hojeInicio)) {
      atrasadas.add(tarefa);
    } else if (vencimento == hojeInicio) {
      doDia.add(tarefa);
    } else {
      porDia.putIfAbsent(tarefa.data!, () => []).add(tarefa);
    }
  }

  final chavesOrdenadas = porDia.keys.toList()..sort();
  return GruposTarefas(
    atrasadas: atrasadas,
    hoje: doDia,
    proximas: {for (final chave in chavesOrdenadas) chave: porDia[chave]!},
    semData: semData,
    concluidas: concluidas,
  );
}

enum FiltroTarefas { todas, pendentes, concluidas, atrasadas }

List<Tarefa> filtrarTarefas(
  List<Tarefa> tarefas,
  FiltroTarefas filtro,
  String busca,
  DateTime hoje,
) {
  final termo = normalizarTexto(busca);
  return tarefas
      .where((tarefa) {
        final passaFiltro = switch (filtro) {
          FiltroTarefas.todas => true,
          FiltroTarefas.pendentes => !tarefa.concluida,
          FiltroTarefas.concluidas => tarefa.concluida,
          FiltroTarefas.atrasadas => estaAtrasada(tarefa, hoje),
        };
        if (!passaFiltro) return false;
        if (termo.isEmpty) return true;
        return normalizarTexto(tarefa.titulo).contains(termo) ||
            normalizarTexto(tarefa.descricao ?? '').contains(termo);
      })
      .toList(growable: false);
}

/// Cria tarefas confirmadas no chat. Regra D06: a data é SEMPRE nula, pois o
/// texto livre nunca é interpretado como data.
List<Tarefa> criarTarefasDoChat(
  List<String> titulos,
  DateTime hoje, {
  required String Function(int indice) novoId,
}) {
  if (titulos.length > limiteTarefasPorChamadaChat) {
    throw const ErroRegraNegocio('Máximo de 3 tarefas por confirmação.');
  }
  final criadas = <Tarefa>[];
  for (var i = 0; i < titulos.length; i++) {
    final titulo = titulos[i].trim();
    if (titulo.isEmpty) {
      throw const ErroRegraNegocio('O título da tarefa não pode ser vazio.');
    }
    criadas.add(
      Tarefa(
        id: novoId(i),
        titulo: titulo,
        concluida: false,
        dataCriacao: hoje,
        data: null,
        origem: OrigemTarefa.chat,
      ),
    );
  }
  return criadas;
}

/// Tarefa nova não pode ter data passada. Retorna a mensagem de erro, se houver.
String? validarDataNovaTarefa(DateTime data, DateTime hoje) {
  if (inicioDoDia(data).isBefore(inicioDoDia(hoje))) {
    return 'Não é possível criar tarefas para datas passadas';
  }
  return null;
}

/// Quanto do conjunto já foi concluído. Alimenta a barra de progresso de Tarefas.
class ProgressoTarefas {
  const ProgressoTarefas({required this.concluidas, required this.total});

  final int concluidas;
  final int total;

  /// Fração de 0 a 1. Sem tarefas, zero (sem divisão por zero).
  double get fracao => total == 0 ? 0 : concluidas / total;
}

ProgressoTarefas progressoTarefas(List<Tarefa> tarefas) => ProgressoTarefas(
  concluidas: tarefas.where((tarefa) => tarefa.concluida).length,
  total: tarefas.length,
);
