import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme/shello_theme.dart';
import '../../app/theme/shello_tokens.dart';
import '../../shared/widgets/shello_logo.dart';

/// Casca das cinco abas. Cada aba mantém sua própria pilha de navegação.
class CascaPrincipal extends StatelessWidget {
  const CascaPrincipal({super.key, required this.navegacao});

  final StatefulNavigationShell navegacao;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navegacao,
      bottomNavigationBar: BarraNavegacaoShello(
        indiceAtual: navegacao.currentIndex,
        aoSelecionar: (indice) => navegacao.goBranch(
          indice,
          initialLocation: indice == navegacao.currentIndex,
        ),
      ),
    );
  }
}

/// Barra inferior da versão original: 4 abas comuns e o botão central elevado do Shello.
class BarraNavegacaoShello extends StatelessWidget {
  const BarraNavegacaoShello({
    super.key,
    required this.indiceAtual,
    required this.aoSelecionar,
  });

  static const double alturaBarra = 78;
  static const double tamanhoBotaoCentral = 60;

  final int indiceAtual;
  final ValueChanged<int> aoSelecionar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final baseSegura = MediaQuery.paddingOf(context).bottom;
    return Container(
      key: const Key('barra-navegacao'),
      height: alturaBarra + baseSegura,
      padding: EdgeInsets.only(bottom: baseSegura),
      decoration: BoxDecoration(
        color: cores.superficie,
        boxShadow: ShelloSombra.suave(cores.textoP),
      ),
      child: Row(
        children: [
          _Aba(
            chave: const Key('aba-inicio'),
            rotulo: 'Início',
            icone: Icons.home_outlined,
            ativa: indiceAtual == 0,
            aoTocar: () => aoSelecionar(0),
          ),
          _Aba(
            chave: const Key('aba-diario'),
            rotulo: 'Diário',
            icone: Icons.menu_book_outlined,
            ativa: indiceAtual == 1,
            aoTocar: () => aoSelecionar(1),
          ),
          Expanded(
            child: _BotaoChat(
              ativo: indiceAtual == 2,
              aoTocar: () => aoSelecionar(2),
            ),
          ),
          _Aba(
            chave: const Key('aba-tarefas'),
            rotulo: 'Tarefas',
            icone: Icons.check_box_outlined,
            ativa: indiceAtual == 3,
            aoTocar: () => aoSelecionar(3),
          ),
          _Aba(
            chave: const Key('aba-perfil'),
            rotulo: 'Perfil',
            icone: Icons.person_outline,
            ativa: indiceAtual == 4,
            aoTocar: () => aoSelecionar(4),
          ),
        ],
      ),
    );
  }
}

class _Aba extends StatelessWidget {
  const _Aba({
    required this.chave,
    required this.rotulo,
    required this.icone,
    required this.ativa,
    required this.aoTocar,
  });

  final Key chave;
  final String rotulo;
  final IconData icone;
  final bool ativa;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final cor = ativa ? cores.marca : cores.textoS;
    return Expanded(
      child: Semantics(
        button: true,
        selected: ativa,
        label: rotulo,
        child: InkWell(
          key: chave,
          onTap: aoTocar,
          child: Padding(
            padding: const EdgeInsets.only(top: ShelloEspaco.sm),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 44,
                  height: 32,
                  decoration: BoxDecoration(
                    color: ativa
                        ? cores.marca.withValues(alpha: 0.1)
                        : Colors.transparent,
                    borderRadius: ShelloForma.raio(16),
                  ),
                  child: Icon(icone, size: 22, color: cor),
                ),
                const SizedBox(height: 2),
                Text(
                  rotulo,
                  style: TextStyle(
                    color: cor,
                    fontSize: 10,
                    fontWeight: ativa ? FontWeight.w700 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BotaoChat extends StatelessWidget {
  const _BotaoChat({required this.ativo, required this.aoTocar});

  final bool ativo;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Center(
      child: Transform.translate(
        offset: const Offset(0, -24),
        child: Semantics(
          button: true,
          label: 'Abrir chat com Shello',
          child: GestureDetector(
            key: const Key('aba-chat'),
            behavior: HitTestBehavior.opaque,
            onTap: aoTocar,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: BarraNavegacaoShello.tamanhoBotaoCentral,
              height: BarraNavegacaoShello.tamanhoBotaoCentral,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ativo ? cores.marca : cores.marcaClaro,
                boxShadow: [
                  BoxShadow(
                    color: cores.marca.withValues(alpha: 0.3),
                    offset: const Offset(0, 4),
                    blurRadius: 8,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(2),
              child: const ShelloLogo(tamanho: 56),
            ),
          ),
        ),
      ),
    );
  }
}
