import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/tarefas/presentation/tarefas_providers.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  Future<void> abrirChat(WidgetTester tester) async {
    await tocar(tester, find.byKey(const Key('aba-chat')));
  }

  testWidgets('abre com a saudação inicial e as sugestões rápidas', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirChat(tester);

    expect(find.textContaining('Sou o Shello'), findsOneWidget);
    expect(find.text('Prática de gratidão'), findsOneWidget);
  });

  testWidgets('enviar mensagem mostra a pergunta e a resposta do Shello', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirChat(tester);

    await digitar(tester, const Key('campo-mensagem'), 'Estou cansada hoje');
    await tocar(tester, find.byKey(const Key('botao-enviar')));

    expect(find.text('Estou cansada hoje'), findsOneWidget);
    expect(find.textContaining('Sinto muito que esteja assim'), findsOneWidget);
  });

  testWidgets(
    'pedido de tarefa mostra o card e confirmar cria a tarefa sem data',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);
      await abrirChat(tester);

      await digitar(
        tester,
        const Key('campo-mensagem'),
        'criar tarefa comprar pão',
      );
      await tocar(tester, find.byKey(const Key('botao-enviar')));

      expect(find.byKey(const Key('card-sugestao-tarefa')), findsOneWidget);
      expect(find.text('Comprar pão'), findsWidgets);

      await tocar(tester, find.byKey(const Key('botao-confirmar-sugestao')));

      final criada = containerDoApp(tester)
          .read(tarefasProvider)
          .singleWhere((t) => t.titulo == 'Comprar pão');
      expect(criada.data, isNull);
      expect(find.byKey(const Key('botao-confirmar-sugestao')), findsNothing);
    },
  );

  testWidgets('novo chat pede confirmação e reinicia a conversa', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirChat(tester);

    await digitar(tester, const Key('campo-mensagem'), 'Oi, tudo bem?');
    await tocar(tester, find.byKey(const Key('botao-enviar')));
    await tocar(tester, find.byKey(const Key('botao-novo-chat')));

    expect(find.text('Novo Chat'), findsOneWidget);
    await tocar(tester, find.text('Iniciar'));

    expect(find.text('Oi, tudo bem?'), findsNothing);
    expect(find.textContaining('Sou o Shello'), findsOneWidget);
  });

  testWidgets('o cabeçalho do chat oferece Novo chat com rótulo de texto', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirChat(tester);

    expect(find.text('Novo chat'), findsOneWidget);
  });
}
