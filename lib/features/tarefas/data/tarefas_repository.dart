import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/storage/colecao_json.dart';
import '../../../core/storage/chaves_armazenamento.dart';
import '../../../core/storage/key_value_store.dart';
import '../../../core/utils/datas.dart';
import '../../../core/utils/identificador.dart';
import '../../../core/utils/relogio.dart';
import '../domain/regras_tarefas.dart';
import '../domain/rotina.dart';
import '../domain/tarefa.dart';

/// Persistência das tarefas ("Sua Jornada"). Concluir uma tarefa registra
/// `concluidaEm`, que alimenta as estatísticas da Home.
class TarefasRepository {
  TarefasRepository({
    required KeyValueStore store,
    required Relogio relogio,
    String chave = ChavesArmazenamento.tarefas,
  }) : _relogio = relogio,
       _colecao = ColecaoJson<Tarefa>(
         store: store,
         chave: chave,
         deJson: Tarefa.fromJson,
         paraJson: (t) => t.toJson(),
       );

  final Relogio _relogio;
  final ColecaoJson<Tarefa> _colecao;

  List<Tarefa> listar() => _colecao.listar();

  Future<Tarefa> adicionar({
    required String titulo,
    String? descricao,
    String? data,
  }) async {
    final tituloLimpo = titulo.trim();
    if (tituloLimpo.isEmpty) {
      throw const ErroRegraNegocio('O título da tarefa não pode ser vazio.');
    }
    final hoje = _relogio();
    final dataVencimento = data == null ? null : dataDeChave(data);
    if (dataVencimento != null) {
      final erro = validarDataNovaTarefa(dataVencimento, hoje);
      if (erro != null) throw ErroRegraNegocio(erro);
    }
    final descricaoLimpa = descricao?.trim();
    final nova = Tarefa(
      id: gerarId(),
      titulo: tituloLimpo,
      descricao: descricaoLimpa == null || descricaoLimpa.isEmpty
          ? null
          : descricaoLimpa,
      data: data,
      concluida: false,
      dataCriacao: hoje,
    );
    await _colecao.salvar([...listar(), nova]);
    return nova;
  }

  /// Confirmação vinda do chat. Regra D06: sem data. Máximo de 3 por chamada.
  Future<List<Tarefa>> adicionarDoChat(List<String> titulos) async {
    final criadas = criarTarefasDoChat(
      titulos,
      _relogio(),
      novoId: (_) => gerarId(),
    );
    await _colecao.salvar([...listar(), ...criadas]);
    return criadas;
  }

  Future<void> editar(
    String id, {
    String? titulo,
    String? descricao,
    String? data,
    bool limparData = false,
  }) async {
    final tituloLimpo = titulo?.trim();
    if (tituloLimpo != null && tituloLimpo.isEmpty) {
      throw const ErroRegraNegocio('O título da tarefa não pode ser vazio.');
    }
    final atualizadas = listar().map((t) {
      if (t.id != id) return t;
      final descricaoLimpa = descricao?.trim();
      return t.copyWith(
        titulo: tituloLimpo,
        descricao: descricao == null
            ? null
            : (descricaoLimpa!.isEmpty ? null : descricaoLimpa),
        limparDescricao: descricao != null && descricaoLimpa!.isEmpty,
        data: data,
        limparData: limparData,
      );
    }).toList();
    await _colecao.salvar(atualizadas);
  }

  Future<void> alternar(String id) async {
    final agora = _relogio();
    final atualizadas = listar().map((t) {
      if (t.id != id) return t;
      if (t.concluida) {
        return t.copyWith(concluida: false, limparConclusao: true);
      }
      return t.copyWith(concluida: true, concluidaEm: agora);
    }).toList();
    await _colecao.salvar(atualizadas);
  }

  Future<void> excluir(String id) async {
    await _colecao.salvar(listar().where((t) => t.id != id).toList());
  }
}

/// Persistência das rotinas diárias (criação, edição e exclusão).
class RotinasRepository {
  RotinasRepository({
    required KeyValueStore store,
    String chave = ChavesArmazenamento.rotinas,
  }) : _colecao = ColecaoJson<Rotina>(
         store: store,
         chave: chave,
         deJson: Rotina.fromJson,
         paraJson: (r) => r.toJson(),
       );

  final ColecaoJson<Rotina> _colecao;

  List<Rotina> listar() => _colecao.listar();

  Future<Rotina> adicionar({
    required String titulo,
    required List<String> atividades,
    required PeriodoRotina periodo,
  }) async {
    final nova = Rotina(
      id: gerarId(),
      titulo: _validarTitulo(titulo),
      atividades: _validarAtividades(atividades),
      periodo: periodo,
    );
    await _colecao.salvar([...listar(), nova]);
    return nova;
  }

  Future<void> editar(
    String id, {
    String? titulo,
    List<String>? atividades,
    PeriodoRotina? periodo,
  }) async {
    final atualizadas = listar().map((r) {
      if (r.id != id) return r;
      return r.copyWith(
        titulo: titulo == null ? null : _validarTitulo(titulo),
        atividades: atividades == null ? null : _validarAtividades(atividades),
        periodo: periodo,
      );
    }).toList();
    await _colecao.salvar(atualizadas);
  }

  Future<void> excluir(String id) async {
    await _colecao.salvar(listar().where((r) => r.id != id).toList());
  }

  static String _validarTitulo(String titulo) {
    final limpo = titulo.trim();
    if (limpo.isEmpty) {
      throw const ErroRegraNegocio('Dê um título para a rotina.');
    }
    return limpo;
  }

  static List<String> _validarAtividades(List<String> atividades) {
    final limpas = atividades
        .map((a) => a.trim())
        .where((a) => a.isNotEmpty)
        .toList();
    if (limpas.isEmpty) {
      throw const ErroRegraNegocio('Inclua ao menos uma atividade na rotina.');
    }
    return limpas;
  }
}
