import 'package:material_ui/material_ui.dart';
import 'package:intl/intl.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/rotina.dart';
import '../domain/tarefa.dart';

/// Linha de tarefa: checkbox com micro-animação, título, selos e atraso destacado.
class ItemTarefa extends StatefulWidget {
  const ItemTarefa({
    super.key,
    required this.tarefa,
    required this.atrasada,
    required this.aoAlternar,
    required this.aoEditar,
    required this.aoExcluir,
  });

  final Tarefa tarefa;
  final bool atrasada;
  final VoidCallback aoAlternar;
  final VoidCallback aoEditar;
  final VoidCallback aoExcluir;

  @override
  State<ItemTarefa> createState() => _ItemTarefaState();
}

class _ItemTarefaState extends State<ItemTarefa>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulso = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 210),
  );

  @override
  void dispose() {
    _pulso.dispose();
    super.dispose();
  }

  Future<void> _marcar() async {
    await _pulso.forward(from: 0);
    widget.aoAlternar();
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final tarefa = widget.tarefa;
    final concluida = tarefa.concluida;
    final escala = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1, end: 0.85), weight: 38),
      TweenSequenceItem(tween: Tween(begin: 0.85, end: 1), weight: 62),
    ]).animate(CurvedAnimation(parent: _pulso, curve: Curves.easeOut));

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 300),
      opacity: concluida ? 0.55 : 1,
      child: ShelloCard(
        key: Key('tarefa-${tarefa.titulo}'),
        raio: ShelloForma.bordaMedia,
        padding: const EdgeInsets.symmetric(
          horizontal: ShelloEspaco.md,
          vertical: ShelloEspaco.md,
        ),
        faixaEsquerda: widget.atrasada
            ? BorderSide(color: cores.erro, width: 4)
            : null,
        onTap: widget.aoEditar,
        child: GestureDetector(
          onLongPress: widget.aoExcluir,
          behavior: HitTestBehavior.translucent,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ScaleTransition(
                scale: escala,
                child: Semantics(
                  checked: concluida,
                  button: true,
                  label: concluida ? 'Desmarcar tarefa' : 'Concluir tarefa',
                  child: GestureDetector(
                    key: Key('checkbox-${tarefa.titulo}'),
                    behavior: HitTestBehavior.opaque,
                    onTap: _marcar,
                    child: Padding(
                      padding: const EdgeInsets.only(
                        top: 2,
                        right: ShelloEspaco.md,
                      ),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 24,
                        height: 24,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: concluida ? cores.marca : cores.superficie,
                          border: Border.all(color: cores.marca, width: 2),
                        ),
                        child: concluida
                            ? Icon(
                                Icons.check,
                                size: 14,
                                color: cores.textoSobreMarca,
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tarefa.titulo,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: concluida ? cores.textoS : cores.textoP,
                        fontSize: 15,
                        height: 1.45,
                        fontWeight: FontWeight.w500,
                        decoration: concluida
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                    ),
                    if (tarefa.descricao != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        tarefa.descricao!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: cores.textoS,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: ShelloEspaco.sm,
                      runSpacing: 4,
                      children: [
                        if (widget.atrasada)
                          _Selo(
                            texto: 'Atrasada',
                            icone: Icons.error_outline,
                            fundo: cores.erroClaro,
                            cor: cores.erro,
                          ),
                        if (tarefa.data != null &&
                            !widget.atrasada &&
                            !concluida)
                          _Selo(
                            texto: DateFormat(
                              'dd MMM yyyy',
                              'pt_BR',
                            ).format(tarefa.dataVencimento!),
                            icone: Icons.calendar_today_outlined,
                            fundo: cores.marcaClaro,
                            cor: cores.marca,
                          ),
                        if (concluida)
                          _Selo(
                            texto: 'Concluída',
                            icone: Icons.check_circle_outline,
                            fundo: Colors.transparent,
                            cor: cores.marca,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Selo extends StatelessWidget {
  const _Selo({
    required this.texto,
    required this.icone,
    required this.fundo,
    required this.cor,
  });

  final String texto;
  final IconData icone;
  final Color fundo;
  final Color cor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ShelloEspaco.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: fundo,
        borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icone, size: 11, color: cor),
          const SizedBox(width: 3),
          Text(
            texto,
            style: TextStyle(
              color: cor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Cartão de rotina com fundo por período do dia.
class CartaoRotina extends StatelessWidget {
  const CartaoRotina({
    super.key,
    required this.rotina,
    required this.aoEditar,
    required this.aoExcluir,
  });

  final Rotina rotina;
  final VoidCallback aoEditar;
  final VoidCallback aoExcluir;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final (fundo, icone) = switch (rotina.periodo) {
      PeriodoRotina.manha => (cores.rotinaManha, Icons.wb_twilight),
      PeriodoRotina.tarde => (cores.rotinaTarde, Icons.wb_sunny_outlined),
      PeriodoRotina.noite => (cores.rotinaNoite, Icons.nights_stay_outlined),
    };
    return ShelloCard(
      key: Key('rotina-${rotina.id}'),
      cor: fundo,
      raio: 20,
      padding: const EdgeInsets.all(ShelloEspaco.lg),
      sombra: false,
      onTap: aoEditar,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: cores.superficie,
                  shape: BoxShape.circle,
                ),
                child: Icon(icone, size: 20, color: cores.marca),
              ),
              const SizedBox(width: ShelloEspaco.md),
              Expanded(
                child: Text(
                  rotina.titulo,
                  style: TextStyle(
                    color: cores.textoP,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              IconButton(
                key: Key('excluir-rotina-${rotina.id}'),
                tooltip: 'Excluir rotina ${rotina.titulo}',
                visualDensity: VisualDensity.compact,
                onPressed: aoExcluir,
                icon: Icon(Icons.delete_outline, size: 18, color: cores.erro),
              ),
            ],
          ),
          const SizedBox(height: ShelloEspaco.md),
          for (final atividade in rotina.atividades)
            Padding(
              padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    margin: const EdgeInsets.only(
                      top: 8,
                      right: ShelloEspaco.sm,
                    ),
                    decoration: BoxDecoration(
                      color: cores.marca,
                      shape: BoxShape.circle,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      atividade,
                      style: TextStyle(
                        color: cores.textoP,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
