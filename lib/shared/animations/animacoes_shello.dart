import 'package:material_ui/material_ui.dart';

/// Entrada suave: fade + deslocamento vertical de 8px (equivalente ao FadeInView).
class EntradaAnimada extends StatefulWidget {
  const EntradaAnimada({
    super.key,
    required this.child,
    this.duracao = const Duration(milliseconds: 500),
  });

  final Widget child;
  final Duration duracao;

  @override
  State<EntradaAnimada> createState() => _EntradaAnimadaState();
}

class _EntradaAnimadaState extends State<EntradaAnimada>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controle = AnimationController(
    vsync: this,
    duration: widget.duracao,
  );
  late final Animation<double> _curva = CurvedAnimation(
    parent: _controle,
    curve: Curves.easeOutCubic,
  );

  @override
  void initState() {
    super.initState();
    // Após o primeiro frame, sem timers: não deixa pendências em testes.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _controle.forward();
    });
  }

  @override
  void dispose() {
    _controle.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curva,
      builder: (context, child) => Opacity(
        opacity: _curva.value,
        child: Transform.translate(
          offset: Offset(0, 8 * (1 - _curva.value)),
          child: child,
        ),
      ),
      child: widget.child,
    );
  }
}

/// Pulsação contínua de opacidade (indicador "Shello está lendo...").
class PulsacaoOpacidade extends StatefulWidget {
  const PulsacaoOpacidade({super.key, required this.child});

  final Widget child;

  @override
  State<PulsacaoOpacidade> createState() => _PulsacaoOpacidadeState();
}

class _PulsacaoOpacidadeState extends State<PulsacaoOpacidade>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controle = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  )..repeat(reverse: true);

  late final Animation<double> _opacidade = Tween<double>(
    begin: 0.3,
    end: 1,
  ).animate(CurvedAnimation(parent: _controle, curve: Curves.easeInOut));

  @override
  void dispose() {
    _controle.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      FadeTransition(opacity: _opacidade, child: widget.child);
}

/// Barras pulsantes usadas enquanto o Shello "digita" a resposta.
class IndicadorDigitando extends StatelessWidget {
  const IndicadorDigitando({super.key, required this.cor});

  final Color cor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (indice) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: PulsacaoOpacidade(
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: cor, shape: BoxShape.circle),
            ),
          ),
        );
      }),
    );
  }
}
