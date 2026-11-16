import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/providers.dart';
import '../../../core/utils/texto.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../chat/domain/motor_respostas.dart';
import '../domain/regras_tarefas.dart';
import '../domain/rotina.dart';
import '../domain/tarefa.dart';
import 'modais_tarefas.dart';
import 'tarefas_providers.dart';
import 'widgets_tarefas.dart';
import '../../../core/utils/datas.dart';

const Map<FiltroTarefas, String> _rotulosFiltro = {
  FiltroTarefas.todas: 'Todas',
  FiltroTarefas.pendentes: 'Pendentes',
  FiltroTarefas.concluidas: 'Concluídas',
  FiltroTarefas.atrasadas: 'Atrasadas',
};

/// "Sua Jornada": tarefas com filtros e busca, além das rotinas diárias por período.
class TelaTarefas extends ConsumerStatefulWidget {
  const TelaTarefas({super.key});

  @override
  ConsumerState<TelaTarefas> createState() => _TelaTarefasState();
}

class _TelaTarefasState extends ConsumerState<TelaTarefas> {
  final _busca = TextEditingController();
  FiltroTarefas _filtro = FiltroTarefas.todas;

  @override
  void dispose() {
    _busca.dispose();
    super.dispose();
  }

  Future<void> _excluirTarefa(Tarefa tarefa) async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Excluir Tarefa',
      mensagem: 'Deseja mesmo remover esta tarefa de sua jornada?',
      rotuloConfirmar: 'Excluir',
      destrutivo: true,
    );
    if (confirmado) await ref.read(tarefasProvider.notifier).excluir(tarefa.id);
  }

  Future<void> _excluirRotina(Rotina rotina) async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Excluir Rotina',
      mensagem: 'Deseja mesmo remover esta rotina?',
      rotuloConfirmar: 'Excluir',
      destrutivo: true,
    );
    if (confirmado) await ref.read(rotinasProvider.notifier).excluir(rotina.id);
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final agora = ref.watch(relogioProvider)();
    final hoje = inicioDoDia(agora);
    final tarefas = ref.watch(tarefasProvider);
    final rotinas = ref.watch(rotinasProvider);
    final filtradas = filtrarTarefas(tarefas, _filtro, _busca.text, agora);
    final grupos = agruparTarefas(filtradas, agora);
    final progresso = progressoTarefas(tarefas);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            ShelloEspaco.lg,
            ShelloEspaco.lg,
            ShelloEspaco.lg,
            ShelloEspaco.xl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Sua Jornada',
                style: TextStyle(
                  color: cores.textoP,
                  fontFamily: ShelloTipo.titulo,
                  fontSize: ShelloTipo.grande,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Organize suas intenções e rituais diários',
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  height: 1.45,
                ),
              ),
              if (tarefas.isNotEmpty) ...[
                const SizedBox(height: ShelloEspaco.md),
                _BarraProgresso(progresso: progresso),
              ],
              const SizedBox(height: ShelloEspaco.md),
              _CampoBuscaTarefas(
                controller: _busca,
                aoMudar: () => setState(() {}),
              ),
              const SizedBox(height: ShelloEspaco.sm),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final filtro in FiltroTarefas.values)
                      Padding(
                        padding: const EdgeInsets.only(right: ShelloEspaco.sm),
                        child: Center(
                          child: ShelloChip(
                            key: Key('filtro-${filtro.name}'),
                            rotulo: _rotulosFiltro[filtro]!,
                            selecionado: _filtro == filtro,
                            onTap: () => setState(() => _filtro = filtro),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: ShelloEspaco.lg),
              _CabecalhoSecao(
                titulo: 'Foco de Hoje',
                acao: _BotaoAdicionar(
                  chave: const Key('botao-nova-tarefa'),
                  rotulo: 'Adicionar nova tarefa',
                  aoTocar: () => abrirFormularioTarefa(context),
                ),
              ),
              const SizedBox(height: ShelloEspaco.md),
              if (tarefas.isEmpty)
                EstadoVazio(
                  expressao: ExpressaoShello.neutro,
                  titulo: 'Nenhuma tarefa ainda',
                  mensagem: 'Adicione sua primeira intenção! Toque no + acima para começar.',
                )
              else if (filtradas.isEmpty)
                EstadoVazio(
                  expressao: ExpressaoShello.duvidoso,
                  titulo: 'Nada por aqui',
                  mensagem:
                      'Nenhuma tarefa corresponde a este filtro ou busca.',
                )
              else
                ..._secoesTarefas(grupos, hoje),
              const SizedBox(height: ShelloEspaco.lg),
              _CabecalhoSecao(
                titulo: 'Rotinas Diárias',
                acao: Row(
                  children: [
                    Container(
                      constraints: const BoxConstraints(minWidth: 26),
                      height: 26,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(
                        color: cores.marcaClaro,
                        borderRadius: ShelloForma.raio(13),
                      ),
                      child: Text(
                        '${rotinas.length}',
                        style: TextStyle(
                          color: cores.marca,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(width: ShelloEspaco.md),
                    _BotaoAdicionar(
                      chave: const Key('botao-nova-rotina'),
                      rotulo: 'Adicionar nova rotina',
                      aoTocar: () => abrirFormularioRotina(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: ShelloEspaco.md),
              if (rotinas.isEmpty)
                Row(
                  children: [
                    Icon(Icons.repeat, size: 28, color: cores.textoS),
                    const SizedBox(width: ShelloEspaco.sm),
                    Expanded(
                      child: Text(
                        'Nenhuma rotina ainda. Crie uma no perfil!',
                        style: TextStyle(
                          color: cores.textoS,
                          fontSize: ShelloTipo.pequeno,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                )
              else
                ..._secoesRotinas(rotinas),
              const SizedBox(height: ShelloEspaco.xxl),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _secoesTarefas(GruposTarefas grupos, DateTime hoje) {
    final cores = context.cores;
    final itens = <Widget>[];

    Widget item(Tarefa t) => Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
      child: ItemTarefa(
        tarefa: t,
        atrasada: estaAtrasada(t, hoje),
        aoAlternar: () => ref.read(tarefasProvider.notifier).alternar(t.id),
        aoEditar: () => abrirFormularioTarefa(context, tarefa: t),
        aoExcluir: () => _excluirTarefa(t),
      ),
    );

    if (grupos.atrasadas.isNotEmpty) {
      itens.add(_Titulo('Atrasadas', cor: cores.erro));
      itens.addAll(grupos.atrasadas.map(item));
    }
    if (grupos.hoje.isNotEmpty) {
      itens.add(const _Titulo('Hoje'));
      itens.addAll(grupos.hoje.map(item));
    }
    for (final entrada in grupos.proximas.entries) {
      final data = dataDeChave(entrada.key);
      final rotulo = capitalizarPrimeiraLetra(
        DateFormat("EEEE, dd 'de' MMMM 'de' yyyy", 'pt_BR').format(data),
      );
      itens.add(_Titulo(rotulo));
      itens.addAll(entrada.value.map(item));
    }
    if (grupos.semData.isNotEmpty) {
      itens.add(const _Titulo('Em Algum Momento'));
      itens.addAll(grupos.semData.map(item));
    }
    if (grupos.concluidas.isNotEmpty) {
      if (grupos.temPendentes) {
        itens.add(const _DivisorConcluidas());
      } else {
        itens.add(
          Padding(
            padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
            child: Row(
              children: [
                Icon(Icons.check_circle_outline, size: 14, color: cores.marca),
                const SizedBox(width: ShelloEspaco.xs),
                Text(
                  'Tudo concluído hoje 🎉',
                  style: TextStyle(
                    color: cores.marca,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        );
      }
      itens.addAll(grupos.concluidas.map(item));
    }
    return itens;
  }

  List<Widget> _secoesRotinas(List<Rotina> rotinas) {
    final itens = <Widget>[];
    for (final periodo in PeriodoRotina.values) {
      final daPeriodo = rotinas.where((r) => r.periodo == periodo).toList();
      if (daPeriodo.isEmpty) continue;
      itens.add(_Titulo(periodo.rotulo));
      for (final rotina in daPeriodo) {
        itens.add(
          Padding(
            padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
            child: CartaoRotina(
              rotina: rotina,
              aoEditar: () => abrirFormularioRotina(context, rotina: rotina),
              aoExcluir: () => _excluirRotina(rotina),
            ),
          ),
        );
      }
    }
    return itens;
  }
}

/// Quanto do dia a pessoa já concluiu: número legível e barra fina.
class _BarraProgresso extends StatelessWidget {
  const _BarraProgresso({required this.progresso});

  final ProgressoTarefas progresso;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final percentual = (progresso.fracao * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '${progresso.concluidas} de ${progresso.total} concluídas',
                style: TextStyle(
                  color: cores.textoP,
                  fontSize: ShelloTipo.pequeno,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Text(
              '$percentual%',
              style: TextStyle(
                color: cores.marca,
                fontSize: ShelloTipo.pequeno,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: ShelloEspaco.xs),
        ClipRRect(
          borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
          child: Container(
            key: const Key('barra-progresso-tarefas'),
            height: 8,
            color: cores.marcaClaro,
            alignment: Alignment.centerLeft,
            child: FractionallySizedBox(
              widthFactor: progresso.fracao,
              child: Container(height: 8, color: cores.marca),
            ),
          ),
        ),
      ],
    );
  }
}

class _CampoBuscaTarefas extends StatelessWidget {
  const _CampoBuscaTarefas({required this.controller, required this.aoMudar});

  final TextEditingController controller;
  final VoidCallback aoMudar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.md),
      decoration: BoxDecoration(
        color: cores.superficie,
        borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
        border: Border.all(color: cores.marcaClaro.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: [
          Icon(Icons.search, size: 16, color: cores.textoS),
          const SizedBox(width: ShelloEspaco.sm),
          Expanded(
            child: TextField(
              key: const Key('campo-busca-tarefas'),
              controller: controller,
              onChanged: (_) => aoMudar(),
              decoration: InputDecoration(
                hintText: 'Buscar tarefas...',
                hintStyle: TextStyle(color: cores.textoS, fontSize: 14),
                border: InputBorder.none,
                isCollapsed: true,
              ),
              style: TextStyle(color: cores.textoP, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _CabecalhoSecao extends StatelessWidget {
  const _CabecalhoSecao({required this.titulo, required this.acao});

  final String titulo;
  final Widget acao;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            titulo,
            style: TextStyle(
              color: context.cores.textoP,
              fontSize: ShelloTipo.medio - 2,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        acao,
      ],
    );
  }
}

class _BotaoAdicionar extends StatelessWidget {
  const _BotaoAdicionar({
    required this.chave,
    required this.rotulo,
    required this.aoTocar,
  });

  final Key chave;
  final String rotulo;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Semantics(
      button: true,
      label: rotulo,
      child: GestureDetector(
        key: chave,
        onTap: aoTocar,
        child: Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: cores.pessego,
            shape: BoxShape.circle,
            boxShadow: ShelloSombra.suave(cores.pessegoDark),
          ),
          child: Icon(Icons.add, size: 20, color: cores.pessegoDark),
        ),
      ),
    );
  }
}

class _Titulo extends StatelessWidget {
  const _Titulo(this.texto, {this.cor});

  final String texto;
  final Color? cor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        top: ShelloEspaco.md,
        bottom: ShelloEspaco.xs,
      ),
      child: Text(
        cor == null ? texto : texto.toUpperCase(),
        style: TextStyle(
          color: cor ?? context.cores.textoS,
          fontSize: ShelloTipo.pequeno,
          fontWeight: cor == null ? FontWeight.w600 : FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _DivisorConcluidas extends StatelessWidget {
  const _DivisorConcluidas();

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: ShelloEspaco.xs),
      child: Row(
        children: [
          Expanded(child: Divider(color: cores.marcaClaro)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.sm),
            child: Text(
              'Concluídas',
              style: TextStyle(
                color: cores.textoS,
                fontSize: ShelloTipo.minusculo,
              ),
            ),
          ),
          Expanded(child: Divider(color: cores.marcaClaro)),
        ],
      ),
    );
  }
}
