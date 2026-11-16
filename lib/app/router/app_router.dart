import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/autenticacao/presentation/sessao_providers.dart';
import '../../features/autenticacao/presentation/tela_autenticacao.dart';
import '../../features/chat/presentation/tela_chat.dart';
import '../../features/chat/presentation/tela_historico_chat.dart';
import '../../features/diario/presentation/tela_diario.dart';
import '../../features/diario/presentation/tela_entrada_diario.dart';
import '../../features/inicio/presentation/tela_inicio.dart';
import '../../features/onboarding/presentation/tela_onboarding.dart';
import '../../features/perfil/presentation/tela_memorias.dart';
import '../../features/perfil/presentation/tela_perfil.dart';
import '../../features/preferencias/presentation/preferencias_providers.dart';
import '../../features/tarefas/presentation/tela_tarefas.dart';
import '../shell/casca_principal.dart';
import 'rotas.dart';

/// Roteador do app. Redireciona conforme sessão e onboarding:
/// sem sessão → autenticação; sessão sem onboarding → onboarding; senão → abas.
final roteadorProvider = Provider<GoRouter>((ref) {
  final mudancas = ValueNotifier<int>(0);
  ref.listen(sessaoProvider, (_, _) => mudancas.value++);
  ref.listen(preferenciasProvider, (_, _) => mudancas.value++);
  ref.onDispose(mudancas.dispose);

  String? redirecionar(String local) {
    final sessao = ref.read(sessaoProvider);
    final onboardingConcluido = ref
        .read(preferenciasProvider)
        .onboardingConcluido;
    if (sessao == null) {
      return local == Rotas.autenticacao ? null : Rotas.autenticacao;
    }
    if (!onboardingConcluido) {
      return local == Rotas.onboarding ? null : Rotas.onboarding;
    }
    if (local == Rotas.autenticacao || local == Rotas.onboarding) {
      return Rotas.inicio;
    }
    return null;
  }

  final roteador = GoRouter(
    initialLocation: Rotas.inicio,
    refreshListenable: mudancas,
    redirect: (context, estado) => redirecionar(estado.matchedLocation),
    routes: [
      GoRoute(
        path: Rotas.autenticacao,
        builder: (context, estado) => const TelaAutenticacao(),
      ),
      GoRoute(
        path: Rotas.onboarding,
        builder: (context, estado) => const TelaOnboarding(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, estado, navegacao) =>
            CascaPrincipal(navegacao: navegacao),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Rotas.inicio,
                builder: (context, estado) => const TelaInicio(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Rotas.diario,
                builder: (context, estado) => const TelaDiario(),
                routes: [
                  GoRoute(
                    path: 'nova',
                    builder: (context, estado) => const TelaEntradaDiario(),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (context, estado) => TelaEntradaDiario(
                      idEntrada: estado.pathParameters['id'],
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Rotas.chat,
                builder: (context, estado) => const TelaChat(),
                routes: [
                  GoRoute(
                    path: 'historico',
                    builder: (context, estado) => const TelaHistoricoChat(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, estado) => TelaHistoricoChat(
                          idConversa: estado.pathParameters['id'],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Rotas.tarefas,
                builder: (context, estado) => const TelaTarefas(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Rotas.perfil,
                builder: (context, estado) => const TelaPerfil(),
                routes: [
                  GoRoute(
                    path: 'memorias',
                    builder: (context, estado) => const TelaMemorias(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
  ref.onDispose(roteador.dispose);
  return roteador;
});
