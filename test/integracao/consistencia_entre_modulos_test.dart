import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/bootstrap.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/domain/formalidade.dart';
import 'package:shello/core/providers.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/autenticacao/presentation/sessao_providers.dart';
import 'package:shello/features/chat/presentation/chat_providers.dart';
import 'package:shello/features/diario/presentation/diario_providers.dart';
import 'package:shello/features/inicio/presentation/inicio_providers.dart';
import 'package:shello/features/perfil/presentation/perfil_providers.dart';
import 'package:shello/features/preferencias/presentation/preferencias_providers.dart';
import 'package:shello/features/tarefas/presentation/tarefas_providers.dart';

/// Testes de integração: o mesmo dado deve aparecer consistente em todas as telas.
/// Cada teste começa em uma conta nova e vazia, como após um cadastro real.
void main() {
  final agora = DateTime(2026, 6, 10, 15);
  late ProviderContainer c;

  setUp(() async {
    final store = MemoriaKeyValueStore();
    await prepararArmazenamento(store: store, relogio: () => agora);
    c = ProviderContainer(
      overrides: [
        keyValueStoreProvider.overrideWithValue(store),
        relogioProvider.overrideWithValue(() => agora),
        atrasoDigitacaoProvider.overrideWithValue(Duration.zero),
      ],
    );
    await c
        .read(sessaoProvider.notifier)
        .registrar(nome: 'Ana', email: 'ana@exemplo.com', senha: 'Senha@123');
  });

  tearDown(() => c.dispose());

  test(
    'tarefa confirmada no chat aparece na lista de tarefas, sem data',
    () async {
      final chat = c.read(chatProvider.notifier);
      await chat.carregar('Ana');
      await chat.enviar('criar tarefa comprar pão');

      final sugestao = c.read(chatProvider).conversa!.mensagens.last;
      expect(sugestao.sugestaoTitulo, 'Comprar pão');

      await chat.confirmarSugestao(sugestao.id);

      final tarefa = c
          .read(tarefasProvider)
          .singleWhere((t) => t.titulo == 'Comprar pão');
      expect(tarefa.data, isNull);
      expect(
        c.read(chatProvider).conversa!.mensagens.last.sugestaoResolvida,
        isTrue,
      );
    },
  );

  test('nova entrada no diário atualiza total e sequência da Home', () async {
    await c
        .read(entradasProvider.notifier)
        .adicionar('Hoje foi um bom dia para revisar tudo.');
    final stats = c.read(estatisticasInicioProvider);
    expect(stats.totalEntradas, 1);
    expect(stats.sequenciaDias, 1);
  });

  test(
    'concluir tarefa atualiza o número de concluídas hoje na Home',
    () async {
      final tarefa = await c
          .read(tarefasProvider.notifier)
          .adicionar(titulo: 'Caminhar');
      await c.read(tarefasProvider.notifier).alternar(tarefa.id);
      expect(c.read(estatisticasInicioProvider).concluidasHoje, 1);
    },
  );

  test(
    'marcar entrada como contexto cria memória no perfil e marca a entrada',
    () async {
      final entrada = await c
          .read(entradasProvider.notifier)
          .adicionar('Quero aprender francês este ano e vou estudar todo dia.');
      await c.read(entradasProvider.notifier).marcarComoContexto(entrada.id);

      expect(c.read(memoriasProvider).single.origemEntradaId, entrada.id);
      expect(c.read(idsNoContextoProvider), contains(entrada.id));
    },
  );

  test('remover a memória no perfil desmarca a entrada do diário', () async {
    final entrada = await c
        .read(entradasProvider.notifier)
        .adicionar('Uma reflexão qualquer.');
    await c.read(entradasProvider.notifier).marcarComoContexto(entrada.id);
    await c
        .read(memoriasProvider.notifier)
        .remover(c.read(memoriasProvider).single.id);
    expect(c.read(idsNoContextoProvider), isNot(contains(entrada.id)));
  });

  test(
    'excluir entrada também remove a memória de contexto do perfil',
    () async {
      final entrada = await c
          .read(entradasProvider.notifier)
          .adicionar('Reflexão que some junto.');
      await c.read(entradasProvider.notifier).marcarComoContexto(entrada.id);
      await c.read(entradasProvider.notifier).excluir(entrada.id);
      expect(c.read(memoriasProvider), isEmpty);
    },
  );

  test(
    'o limite de 20 mensagens bloqueia a troca que o ultrapassaria',
    () async {
      final chat = c.read(chatProvider.notifier);
      await chat.carregar('Ana');
      for (var i = 0; i < 10; i++) {
        await chat.enviar('oi $i');
      }
      expect(() => chat.enviar('mais uma'), throwsA(isA<ErroRegraNegocio>()));
      expect(c.read(chatProvider).conversa!.mensagensContaveis, 20);
    },
  );

  test('novo chat arquiva a conversa e inicia outra com saudação', () async {
    final chat = c.read(chatProvider.notifier);
    await chat.carregar('Ana');
    await chat.enviar('oi');
    await chat.novaConversa('Ana');
    expect(c.read(chatProvider).conversa!.mensagensContaveis, 0);
    expect(c.read(chatProvider).historico.length, 1);
  });

  test(
    'formalidade escolhida no perfil altera as respostas do Shello',
    () async {
      await c
          .read(preferenciasProvider.notifier)
          .definirFormalidade(Formalidade.alta);
      final chat = c.read(chatProvider.notifier);
      await chat.carregar('Ana');
      await chat.enviar('oi');
      expect(
        c.read(chatProvider).conversa!.mensagens.last.conteudo,
        contains('Como posso ajudar?'),
      );
    },
  );

  test(
    'entrar com a conta de demonstração inicia a sessão e sair a encerra',
    () async {
      await c
          .read(sessaoProvider.notifier)
          .entrar('demo@exemplo.com', 'Demo@1234');
      expect(c.read(sessaoProvider)!.nome, 'Ana');
      await c.read(sessaoProvider.notifier).sair();
      expect(c.read(sessaoProvider), isNull);
    },
  );
}
