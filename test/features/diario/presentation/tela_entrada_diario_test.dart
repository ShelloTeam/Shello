import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:shello/features/diario/presentation/diario_providers.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  testWidgets('uma entrada nova mostra a data de hoje pelo relógio do app', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await tocar(tester, find.byKey(const Key('aba-diario')));
    await tocar(tester, find.byKey(const Key('botao-nova-entrada')));

    expect(find.text('Quarta-feira, 10 de junho'), findsOneWidget);
  });

  testWidgets(
    'editar uma entrada antiga mostra a data em que ela foi escrita',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);
      await tocar(tester, find.byKey(const Key('aba-diario')));
      await tocar(tester, find.byKey(const Key('cartao-entrada-entrada-03')));

      expect(find.text('Segunda-feira, 8 de junho'), findsOneWidget);
      expect(find.text('Quarta-feira, 10 de junho'), findsNothing);
    },
  );

  testWidgets(
    'voltar com texto não salvo pede confirmação antes de descartar',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);
      await tocar(tester, find.byKey(const Key('aba-diario')));
      await tocar(tester, find.byKey(const Key('botao-nova-entrada')));
      await digitar(
        tester,
        const Key('campo-texto-entrada'),
        'Rascunho ainda não salvo',
      );

      await tocar(tester, find.byKey(const Key('botao-voltar-editor')));
      expect(find.text('Descartar alterações?'), findsOneWidget);

      await tocar(tester, find.text('Cancelar'));
      expect(find.byKey(const Key('campo-texto-entrada')), findsOneWidget);
    },
  );

  testWidgets('descartar as alterações sai do editor sem criar a entrada', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await tocar(tester, find.byKey(const Key('aba-diario')));
    final total = containerDoApp(tester).read(entradasProvider).length;
    await tocar(tester, find.byKey(const Key('botao-nova-entrada')));
    await digitar(
      tester,
      const Key('campo-texto-entrada'),
      'Rascunho descartado',
    );

    await tocar(tester, find.byKey(const Key('botao-voltar-editor')));
    await tocar(tester, find.text('Descartar'));

    expect(find.byKey(const Key('campo-texto-entrada')), findsNothing);
    expect(containerDoApp(tester).read(entradasProvider).length, total);
  });

  testWidgets('o gesto de voltar do sistema também pede confirmação', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await tocar(tester, find.byKey(const Key('aba-diario')));
    await tocar(tester, find.byKey(const Key('botao-nova-entrada')));
    await digitar(
      tester,
      const Key('campo-texto-entrada'),
      'Rascunho pelo gesto',
    );

    await tester.binding.handlePopRoute();
    await aguardar(tester);

    expect(find.text('Descartar alterações?'), findsOneWidget);
  });
}
