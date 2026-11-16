import 'package:material_ui/material_ui.dart';

import '../../app/theme/shello_theme.dart';

/// Logo circular do mascote, com borda suave opcional.
class ShelloLogo extends StatelessWidget {
  const ShelloLogo({
    super.key,
    required this.tamanho,
    this.comBorda = false,
    this.borda = 3,
  });

  static const String asset = 'assets/images/logoshello.jpeg';

  final double tamanho;
  final bool comBorda;
  final double borda;

  @override
  Widget build(BuildContext context) {
    final imagem = ClipOval(
      child: Image.asset(
        asset,
        width: tamanho,
        height: tamanho,
        fit: BoxFit.cover,
        semanticLabel: 'Logo do Shello',
      ),
    );
    if (!comBorda) return imagem;
    return Container(
      padding: EdgeInsets.all(borda),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: context.cores.marcaClaro,
      ),
      child: imagem,
    );
  }
}
