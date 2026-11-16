import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/bootstrap.dart';
import 'package:shello/core/mocks/dados_demonstracao.dart';
import 'package:shello/core/mocks/restauracao_demonstracao.dart';
import 'package:shello/core/providers.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/autenticacao/presentation/sessao_providers.dart';
import 'package:shello/features/chat/presentation/chat_providers.dart';
import 'package:shello/features/diario/presentation/diario_providers.dart';
import 'package:shello/features/onboarding/domain/dados_onboarding.dart';
import 'package:shello/features/perfil/presentation/perfil_providers.dart';
import 'package:shello/features/preferencias/domain/preferencias_usuario.dart';
import 'package:shello/features/preferencias/presentation/preferencias_providers.dart';
import 'package:shello/features/tarefas/presentation/tarefas_providers.dart';

/// Cada conta enxerga somente os próprios dados, mesmo no mesmo aparelho.
void main() {
  final agora = DateTime(2026, 6, 10, 15);
  late MemoriaKeyValueStore store;
  late ProviderContainer c;

  Future<void> entrarNaDemo() =>
      c.read(sessaoProvider.notifier).entrar('demo@exemplo.com', 'Demo@1234');

  Future<void> sair() => c.read(sessaoProvider.notifier).sair();

  Future<void> criarBia() => c
      .read(sessaoProvider.notifier)
      .registrar(nome: 'Bia', email: 'bia@exemplo.com', senha: 'Senha@123');

  setUp(() async {
    store = MemoriaKeyValueStore();
    await prepararArmazenamento(store: store, relogio: () => agora);
    c = ProviderContainer(
      overrides: [
        keyValueStoreProvider.overrideWithValue(store),
        relogioProvider.overrideWithValue(() => agora),
        atrasoDigitacaoProvider.overrideWithValue(Duration.zero),
      ],
    );
  });

  tearDown(() => c.dispose());

  test('conta nova não herda diário, tarefas, rotinas, memórias nem conversas da demonstração', () async {
    await entrarNaDemo();
    expect(c.read(entradasProvider), isNotEmpty);
    expect(c.read(tarefasProvider), isNotEmpty);
    expect(c.read(rotinasProvider), isNotEmpty);
    expect(c.read(memoriasProvider), isNotEmpty);
    await c.read(chatProvider.notifier).carregar('Ana');
    expect(c.read(chatProvider).historico, isNotEmpty);

    await sair();
    expect(c.read(entradasProvider), isEmpty);

    await criarBia();

    expect(c.read(entradasProvider), isEmpty);
    expect(c.read(tarefasProvider), isEmpty);
    expect(c.read(rotinasProvider), isEmpty);
    expect(c.read(memoriasProvider), isEmpty);
    expect(c.read(chatProvider).historico, isEmpty);
  });

  test(
    'conta nova começa com onboarding pendente e sem nome de referência',
    () async {
      await entrarNaDemo();
      expect(c.read(preferenciasProvider).nomeReferencia, 'Ana');
      expect(c.read(preferenciasProvider).onboardingConcluido, isTrue);

      await sair();
      await criarBia();

      final preferencias = c.read(preferenciasProvider);
      expect(preferencias.onboardingConcluido, isFalse);
      expect(preferencias.nomeReferencia, isEmpty);
    },
  );

  test('preferências pertencem a cada conta', () async {
    await criarBia();
    await c
        .read(preferenciasProvider.notifier)
        .concluirOnboarding(
          const DadosOnboarding(nome: 'Bia', estiloDeVida: '', metaAtual: ''),
        );
    await c.read(preferenciasProvider.notifier).definirTema(TemaApp.escuro);

    await sair();
    await entrarNaDemo();
    expect(c.read(preferenciasProvider).nomeReferencia, 'Ana');
    expect(c.read(preferenciasProvider).tema, TemaApp.claro);

    await sair();
    await c
        .read(sessaoProvider.notifier)
        .entrar('bia@exemplo.com', 'Senha@123');
    expect(c.read(preferenciasProvider).nomeReferencia, 'Bia');
    expect(c.read(preferenciasProvider).tema, TemaApp.escuro);
  });

  test('os dados de cada conta permanecem ao sair e voltar', () async {
    await entrarNaDemo();
    final totalDemo = c.read(entradasProvider).length;
    await c
        .read(entradasProvider.notifier)
        .adicionar('Um dia novo na demonstração.');

    await sair();
    await criarBia();
    expect(c.read(entradasProvider), isEmpty);
    await c
        .read(entradasProvider.notifier)
        .adicionar('Primeira reflexão da Bia.');

    await sair();
    await entrarNaDemo();
    expect(c.read(entradasProvider), hasLength(totalDemo + 1));
    expect(
      c.read(entradasProvider).map((e) => e.conteudo),
      isNot(contains('Primeira reflexão da Bia.')),
    );
  });

  test('restaurar a demonstração não altera a conta em uso', () async {
    await criarBia();
    await c.read(tarefasProvider.notifier).adicionar(titulo: 'Tarefa da Bia');

    await restaurarDemonstracao(store: store, relogio: () => agora);
    c.invalidate(tarefasProvider);

    expect(c.read(sessaoProvider)!.nome, 'Bia');
    expect(c.read(tarefasProvider).map((t) => t.titulo), ['Tarefa da Bia']);
  });

  test('restaurar a demonstração regrava os dados da conta demo', () async {
    await entrarNaDemo();
    await c
        .read(tarefasProvider.notifier)
        .adicionar(titulo: 'Tarefa temporária');
    await sair();

    await restaurarDemonstracao(store: store, relogio: () => agora);
    await entrarNaDemo();

    expect(
      c.read(tarefasProvider).any((t) => t.titulo == 'Tarefa temporária'),
      isFalse,
    );
    expect(
      c.read(tarefasProvider),
      hasLength(DadosDemonstracao.criar(agora).tarefas.length),
    );
  });
}
