import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/perfil/presentation/perfil_providers.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  testWidgets('a Home mostra data por extenso em português', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);

    expect(find.textContaining('Quarta-feira'), findsOneWidget);
  });

  testWidgets('a Home mostra a sequência e o total de entradas do diário', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);

    expect(find.text('dias seguidos'), findsOneWidget);
    expect(
      tester.widget<Text>(find.byKey(const Key('sequencia-dias'))).data,
      '3',
    );
    expect(find.text('6 entradas'), findsOneWidget);
  });

  testWidgets(
    'a Home rotula "Para hoje" as tarefas de hoje e as atrasadas ainda abertas',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);

      expect(find.text('Para hoje'), findsOneWidget);
      expect(find.text('Abertas hoje'), findsNothing);
    },
  );

  testWidgets('Adicionar Contexto cria uma memória com o tipo escolhido', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    final memoriasAntes = containerDoApp(tester).read(memoriasProvider).length;

    await tocar(tester, find.byKey(const Key('atalho-contexto')));
    await digitar(tester, const Key('campo-contexto'), 'Quero aprender violão');
    await tocar(tester, find.byKey(const Key('tipo-OBJETIVO')));
    await tocar(tester, find.byKey(const Key('botao-salvar-contexto')));

    final memorias = containerDoApp(tester).read(memoriasProvider);
    expect(memorias.length, memoriasAntes + 1);
    expect(memorias.any((m) => m.conteudo == 'Quero aprender violão'), isTrue);
  });

  testWidgets('a faixa da semana mostra os sete últimos dias', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);

    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget.key is ValueKey<String> &&
            (widget.key! as ValueKey<String>).value.startsWith('dia-semana-'),
      ),
      findsNWidgets(7),
    );
  });
}
