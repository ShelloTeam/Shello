import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/memoria.dart';
import 'perfil_providers.dart';

/// Cores de cada categoria de memória (mesma paleta semântica da versão original).
class _CoresTipo {
  const _CoresTipo(this.fundo, this.texto);

  final Color fundo;
  final Color texto;
}

const Map<TipoMemoria, _CoresTipo> _coresTipo = {
  TipoMemoria.preferencia: _CoresTipo(Color(0xFFD6E2D8), Color(0xFF5E836A)),
  TipoMemoria.fato: _CoresTipo(Color(0xFFEADCD6), Color(0xFF8B5E3C)),
  TipoMemoria.objetivo: _CoresTipo(Color(0xFFD1E8F0), Color(0xFF1565C0)),
  TipoMemoria.habito: _CoresTipo(Color(0xFFF0EAD6), Color(0xFF7B6B3A)),
  TipoMemoria.contexto: _CoresTipo(Color(0xFFE8D6F0), Color(0xFF6B3A7B)),
  TipoMemoria.relacionamento: _CoresTipo(Color(0xFFF0D6D6), Color(0xFF7B3A3A)),
};

/// Cartão de uma memória: rótulo do tipo, conteúdo e exclusão com confirmação.
class CartaoMemoria extends ConsumerWidget {
  const CartaoMemoria({super.key, required this.memoria});

  final Memoria memoria;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cores = context.cores;
    final tipo = _coresTipo[memoria.tipo]!;
    return ShelloCard(
      key: Key('cartao-memoria-${memoria.id}'),
      raio: ShelloForma.bordaPequena,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.sm,
                  vertical: ShelloEspaco.xs,
                ),
                decoration: BoxDecoration(
                  color: tipo.fundo,
                  borderRadius: ShelloForma.raio(ShelloForma.bordaPequena),
                ),
                child: Text(
                  memoria.tipo.rotulo,
                  style: TextStyle(
                    color: tipo.texto,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                key: Key('excluir-memoria-${memoria.id}'),
                tooltip: 'Remover memória',
                visualDensity: VisualDensity.compact,
                onPressed: () => _confirmarRemocao(context, ref),
                icon: Icon(Icons.delete_outline, size: 18, color: cores.textoS),
              ),
            ],
          ),
          Text(
            memoria.conteudo,
            style: TextStyle(
              color: cores.textoP,
              fontSize: ShelloTipo.pequeno,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarRemocao(BuildContext context, WidgetRef ref) async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Remover memória',
      mensagem: 'O Shello deixará de usar esta informação nas respostas. Deseja remover?',
      rotuloConfirmar: 'Remover',
      destrutivo: true,
    );
    if (confirmado) {
      await ref.read(memoriasProvider.notifier).remover(memoria.id);
    }
  }
}
