import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/providers.dart';
import '../../../core/utils/datas.dart';
import '../../../core/utils/texto.dart';
import '../../../shared/animations/animacoes_shello.dart';
import '../../chat/domain/motor_respostas.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/entrada_diario.dart';
import 'diario_providers.dart';

enum FiltroDiario { todas, contexto, hoje, ontem, semana, antigas }

extension on FiltroDiario {
  String get rotulo => switch (this) {
    FiltroDiario.todas => 'Todas',
    FiltroDiario.contexto => 'No Contexto',
    FiltroDiario.hoje => 'Hoje',
    FiltroDiario.ontem => 'Ontem',
    FiltroDiario.semana => 'Esta Semana',
    FiltroDiario.antigas => 'Mais Antigas',
  };
}

/// Lista do diário, agrupada por Hoje, Ontem, Semana Passada e Mais Antigas.
class TelaDiario extends ConsumerStatefulWidget {
  const TelaDiario({super.key});

  @override
  ConsumerState<TelaDiario> createState() => _TelaDiarioState();
}

class _TelaDiarioState extends ConsumerState<TelaDiario> {
  final _busca = TextEditingController();
  FiltroDiario _filtro = FiltroDiario.todas;

  @override
  void dispose() {
    _busca.dispose();
    super.dispose();
  }

  void _limparFiltros() {
    setState(() {
      _busca.clear();
      _filtro = FiltroDiario.todas;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final agora = ref.watch(relogioProvider)();
    final entradas = ref.watch(entradasProvider);
    final noContexto = ref.watch(idsNoContextoProvider);
    final filtradas = _aplicarFiltros(entradas, noContexto, agora);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                ShelloEspaco.lg,
                ShelloEspaco.md,
                ShelloEspaco.lg,
                0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Meu Diário',
                              style: TextStyle(
                                color: cores.textoP,
                                fontFamily: ShelloTipo.titulo,
                                fontSize: ShelloTipo.grande,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'Suas reflexões e memórias',
                              style: TextStyle(
                                color: cores.textoS,
                                fontSize: ShelloTipo.minusculo,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: cores.marcaClaro,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.menu_book_outlined,
                          size: 20,
                          color: cores.marca,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: ShelloEspaco.md),
                  ShelloBotaoPrincipal(
                    key: const Key('botao-nova-entrada'),
                    rotulo: 'Nova Entrada',
                    icone: Icons.add,
                    onPressed: () => context.push(Rotas.novaEntrada),
                  ),
                  const SizedBox(height: ShelloEspaco.md),
                  _CampoBusca(
                    controller: _busca,
                    aoMudar: () => setState(() {}),
                  ),
                  const SizedBox(height: ShelloEspaco.sm),
                  SizedBox(
                    height: 44,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        for (final filtro in FiltroDiario.values)
                          Padding(
                            padding: const EdgeInsets.only(
                              right: ShelloEspaco.sm,
                            ),
                            child: Center(
                              child: ShelloChip(
                                key: Key('filtro-diario-${filtro.name}'),
                                rotulo: filtro.rotulo,
                                selecionado: _filtro == filtro,
                                onTap: () => setState(() => _filtro = filtro),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: entradas.isEmpty
                  ? SingleChildScrollView(
                      child: EstadoVazio(
                        expressao: ExpressaoShello.feliz,
                        titulo: 'Seu diário está em branco',
                        mensagem:
                            'Registre seus pensamentos, sentimentos e reflexões. '
                            'Cada entrada é um passo na sua jornada.',
                        rotuloAcao: 'Escrever primeira entrada',
                        iconeAcao: Icons.edit_outlined,
                        aoAcao: () => context.push(Rotas.novaEntrada),
                      ),
                    )
                  : filtradas.isEmpty
                  ? EstadoVazio(
                      expressao: ExpressaoShello.duvidoso,
                      titulo: 'Nenhuma entrada encontrada',
                      mensagem:
                          'Não encontramos nenhuma reflexão com '
                          '${_busca.text.isEmpty ? 'esse filtro' : '"${_busca.text}"'}. '
                          'Tente ajustar sua busca ou limpar os filtros.',
                      rotuloAcao: 'Limpar filtros e busca',
                      aoAcao: _limparFiltros,
                    )
                  : _Lista(
                      entradas: filtradas,
                      noContexto: noContexto,
                      agora: agora,
                      aoAbrir: (entrada) =>
                          context.push(Rotas.entrada(entrada.id)),
                      aoExcluir: _confirmarExclusao,
                    ),
            ),
          ],
        ),
      ),
    );
  }

  List<EntradaDiario> _aplicarFiltros(
    List<EntradaDiario> entradas,
    Set<String> noContexto,
    DateTime agora,
  ) {
    final termo = normalizarTexto(_busca.text);
    final hoje = inicioDoDia(agora);
    final ontem = diaAnterior(hoje);
    final semanaAtras = DateTime(hoje.year, hoje.month, hoje.day - 7);
    return entradas.where((entrada) {
      final casaBusca =
          termo.isEmpty ||
          normalizarTexto(entrada.titulo).contains(termo) ||
          normalizarTexto(entrada.conteudo).contains(termo);
      if (!casaBusca) return false;
      final dia = inicioDoDia(entrada.dataCriacao);
      return switch (_filtro) {
        FiltroDiario.todas => true,
        FiltroDiario.contexto => noContexto.contains(entrada.id),
        FiltroDiario.hoje => dia == hoje,
        FiltroDiario.ontem => dia == ontem,
        FiltroDiario.semana => !dia.isBefore(semanaAtras),
        FiltroDiario.antigas => dia.isBefore(semanaAtras),
      };
    }).toList();
  }

  Future<void> _confirmarExclusao(EntradaDiario entrada) async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Excluir Entrada',
      mensagem: 'Tem certeza que deseja apagar esta reflexão? Esta ação não pode ser desfeita.',
      rotuloConfirmar: 'Excluir',
      rotuloCancelar: 'Cancelar',
      destrutivo: true,
    );
    if (confirmado) {
      await ref.read(entradasProvider.notifier).excluir(entrada.id);
    }
  }
}

class _CampoBusca extends StatelessWidget {
  const _CampoBusca({required this.controller, required this.aoMudar});

  final TextEditingController controller;
  final VoidCallback aoMudar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.md),
      decoration: BoxDecoration(
        color: cores.superficie,
        borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
        border: Border.all(color: cores.marcaClaro.withValues(alpha: 0.6)),
        boxShadow: ShelloSombra.suave(cores.textoP),
      ),
      child: Row(
        children: [
          Icon(Icons.search, size: 18, color: cores.textoS),
          const SizedBox(width: ShelloEspaco.sm),
          Expanded(
            child: TextField(
              key: const Key('campo-busca-diario'),
              controller: controller,
              onChanged: (_) => aoMudar(),
              decoration: InputDecoration(
                hintText: 'Buscar nas suas reflexões...',
                hintStyle: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                ),
                border: InputBorder.none,
                isCollapsed: true,
              ),
              style: TextStyle(
                color: cores.textoP,
                fontSize: ShelloTipo.pequeno,
              ),
            ),
          ),
          if (controller.text.isNotEmpty)
            IconButton(
              tooltip: 'Limpar busca',
              onPressed: () {
                controller.clear();
                aoMudar();
              },
              icon: Icon(Icons.close, size: 16, color: cores.textoS),
            ),
        ],
      ),
    );
  }
}

class _Lista extends StatelessWidget {
  const _Lista({
    required this.entradas,
    required this.noContexto,
    required this.agora,
    required this.aoAbrir,
    required this.aoExcluir,
  });

  final List<EntradaDiario> entradas;
  final Set<String> noContexto;
  final DateTime agora;
  final ValueChanged<EntradaDiario> aoAbrir;
  final ValueChanged<EntradaDiario> aoExcluir;

  @override
  Widget build(BuildContext context) {
    final hoje = inicioDoDia(agora);
    final ontem = diaAnterior(hoje);
    final semanaAtras = DateTime(hoje.year, hoje.month, hoje.day - 7);
    final grupos = <String, List<EntradaDiario>>{
      'Hoje': [],
      'Ontem': [],
      'Semana Passada': [],
      'Mais Antigas': [],
    };
    for (final entrada in entradas) {
      final dia = inicioDoDia(entrada.dataCriacao);
      if (dia == hoje) {
        grupos['Hoje']!.add(entrada);
      } else if (dia == ontem) {
        grupos['Ontem']!.add(entrada);
      } else if (!dia.isBefore(semanaAtras)) {
        grupos['Semana Passada']!.add(entrada);
      } else {
        grupos['Mais Antigas']!.add(entrada);
      }
    }

    final itens = <Widget>[];
    grupos.forEach((titulo, lista) {
      if (lista.isEmpty) return;
      itens.add(
        Padding(
          padding: const EdgeInsets.only(
            top: ShelloEspaco.md,
            bottom: ShelloEspaco.sm,
          ),
          child: Text(
            titulo,
            style: TextStyle(
              color: context.cores.marca,
              fontFamily: ShelloTipo.titulo,
              fontSize: ShelloTipo.pequeno,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );
      for (final entrada in lista) {
        itens.add(
          Padding(
            padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
            child: _CartaoEntrada(
              entrada: entrada,
              noContexto: noContexto.contains(entrada.id),
              lendo: _estaLendo(entrada),
              aoAbrir: () => aoAbrir(entrada),
              aoExcluir: () => aoExcluir(entrada),
            ),
          ),
        );
      }
    });

    return EntradaAnimada(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          ShelloEspaco.lg,
          0,
          ShelloEspaco.lg,
          ShelloEspaco.xl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: itens,
        ),
      ),
    );
  }

  /// "Shello está lendo..." aparece por 5 segundos após criar uma entrada longa.
  bool _estaLendo(EntradaDiario entrada) {
    return entrada.mereceAnalise &&
        entrada.dataAtualizacao == null &&
        agora.difference(entrada.dataCriacao) < const Duration(seconds: 5);
  }
}

class _CartaoEntrada extends StatelessWidget {
  const _CartaoEntrada({
    required this.entrada,
    required this.noContexto,
    required this.lendo,
    required this.aoAbrir,
    required this.aoExcluir,
  });

  final EntradaDiario entrada;
  final bool noContexto;
  final bool lendo;
  final VoidCallback aoAbrir;
  final VoidCallback aoExcluir;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return ShelloCard(
      key: Key('cartao-entrada-${entrada.id}'),
      raio: ShelloForma.bordaPequena,
      padding: const EdgeInsets.all(ShelloEspaco.md),
      borda: BorderSide(color: cores.marcaClaro.withValues(alpha: 0.6)),
      onTap: aoAbrir,
      child: GestureDetector(
        onLongPress: aoExcluir,
        behavior: HitTestBehavior.translucent,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (entrada.titulo.isNotEmpty)
              Text(
                entrada.titulo,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: cores.textoP,
                  fontFamily: ShelloTipo.titulo,
                  fontSize: ShelloTipo.pequeno,
                  fontWeight: FontWeight.w700,
                ),
              ),
            if (entrada.previa.isNotEmpty) ...[
              if (entrada.titulo.isNotEmpty)
                const SizedBox(height: ShelloEspaco.xs),
              Text(
                entrada.previa,
                maxLines: entrada.titulo.isEmpty ? 3 : 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  height: 1.5,
                ),
              ),
            ],
            const SizedBox(height: ShelloEspaco.sm),
            Row(
              children: [
                Text(
                  DateFormat(
                    'dd MMM, HH:mm',
                    'pt_BR',
                  ).format(entrada.dataCriacao),
                  style: TextStyle(
                    color: cores.textoS,
                    fontSize: ShelloTipo.minusculo,
                  ),
                ),
                const Spacer(),
                if (noContexto) _SeloContexto(),
              ],
            ),
            if (lendo) ...[
              const SizedBox(height: ShelloEspaco.sm),
              Divider(height: 1, color: cores.marcaClaro),
              const SizedBox(height: ShelloEspaco.sm),
              PulsacaoOpacidade(
                child: Row(
                  children: [
                    Icon(Icons.memory, size: 12, color: cores.marca),
                    const SizedBox(width: 4),
                    Text(
                      'Shello está lendo...',
                      style: TextStyle(
                        color: cores.marca,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SeloContexto extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ShelloEspaco.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: cores.marcaClaro,
        borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline, size: 10, color: cores.marca),
          const SizedBox(width: 3),
          Text(
            'No contexto do Shello',
            style: TextStyle(
              color: cores.marca,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
