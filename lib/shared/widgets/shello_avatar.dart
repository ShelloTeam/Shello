import 'package:material_ui/material_ui.dart';

import '../../app/theme/shello_theme.dart';
import '../../features/chat/domain/motor_respostas.dart';

/// Mascote recortado da sprite de expressões (4 quadros lado a lado).
///
/// Mesmo método da versão React Native: a sprite é esticada para 4 vezes o
/// tamanho do avatar e deslocada para exibir apenas o quadro da expressão.
class ShelloAvatar extends StatelessWidget {
  const ShelloAvatar({
    super.key,
    required this.expressao,
    required this.tamanho,
  });

  static const String asset = 'assets/images/shello-expressoes.jpeg';

  final ExpressaoShello expressao;
  final double tamanho;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: SizedBox(
        width: tamanho,
        height: tamanho,
        child: ColoredBox(
          color: context.cores.marcaClaro,
          child: OverflowBox(
            alignment: Alignment.topLeft,
            minWidth: tamanho * 4,
            maxWidth: tamanho * 4,
            minHeight: tamanho,
            maxHeight: tamanho,
            child: Transform.translate(
              offset: Offset(-tamanho * expressao.indiceNaSprite, 0),
              child: Image.asset(
                asset,
                width: tamanho * 4,
                height: tamanho,
                fit: BoxFit.cover,
                semanticLabel: 'Shello ${expressao.name}',
              ),
            ),
          ),
        ),
      ),
    );
  }
}
