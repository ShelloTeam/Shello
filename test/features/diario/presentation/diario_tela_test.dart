import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/storage/chaves_armazenamento.dart';
import 'package:shello/core/storage/escopo_conta_key_value_store.dart';
import 'package:shello/shared/widgets/shello_avatar.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  Future<void> abrirDiario(WidgetTester tester) async {
    await tocar(tester, find.byKey(const Key('aba-diario')));
  }

  testWidgets('diário vazio mostra o estado vazio com ação de escrever', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await EscopoContaKeyValueStore(store)
        .gravar(ChavesArmazenamento.entradas, '[]');
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    expect(find.text('Seu diário está em branco'), findsOneWidget);
    expect(find.text('Escrever primeira entrada'), findsOneWidget);
  });

  testWidgets('criar entrada a mostra em Hoje com o texto digitado', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    await tocar(tester, find.byKey(const Key('botao-nova-entrada')));
    await digitar(
      tester,
      const Key('campo-texto-entrada'),
      'Reflexão de teste para a lista',
    );
    await tocar(tester, find.byKey(const Key('botao-finalizar-entrada')));

    expect(find.text('Hoje'), findsWidgets);
    expect(find.textContaining('Reflexão de teste para a lista'), findsWidgets);
  });

  testWidgets('editar uma entrada salva o novo texto', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    await tocar(tester, find.byKey(const Key('cartao-entrada-entrada-05')));
    await digitar(
      tester,
      const Key('campo-texto-entrada'),
      'Dia cansativo, revisado depois.',
    );
    await tocar(tester, find.byKey(const Key('botao-finalizar-entrada')));

    expect(find.textContaining('revisado depois'), findsWidgets);
  });

  testWidgets('excluir entrada pede confirmação e só remove após confirmar', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    await tocar(tester, find.byKey(const Key('cartao-entrada-entrada-05')));
    await tocar(tester, find.byKey(const Key('botao-excluir-entrada')));
    expect(find.text('Excluir Entrada'), findsOneWidget);

    await tocar(tester, find.text('Cancelar'));
    await tocar(tester, find.byKey(const Key('botao-voltar-editor')));
    expect(find.textContaining('Dia cansativo'), findsWidgets);

    await tocar(tester, find.byKey(const Key('cartao-entrada-entrada-05')));
    await tocar(tester, find.byKey(const Key('botao-excluir-entrada')));
    await tocar(tester, find.text('Excluir'));

    expect(find.textContaining('Dia cansativo'), findsNothing);
  });

  testWidgets('busca filtra as entradas pelo texto', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    await digitar(tester, const Key('campo-busca-diario'), 'francês');

    expect(find.textContaining('francês'), findsWidgets);
    expect(find.textContaining('caminhada'), findsNothing);
  });

  testWidgets('marcar como contexto mostra o selo "No contexto do Shello"', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    await tocar(tester, find.byKey(const Key('cartao-entrada-entrada-05')));
    await tocar(tester, find.byKey(const Key('botao-contexto-shello')));
    await tocar(tester, find.byKey(const Key('botao-voltar-editor')));

    expect(find.text('No contexto do Shello'), findsWidgets);
  });

  testWidgets('diário vazio mostra o mascote no estado vazio', (tester) async {
    final store = await armazenamentoComSessao();
    await EscopoContaKeyValueStore(store)
        .gravar(ChavesArmazenamento.entradas, '[]');
    await subirApp(tester, store: store);
    await abrirDiario(tester);

    expect(find.byType(ShelloAvatar), findsOneWidget);
  });

  testWidgets(
    'o cartão mostra a primeira frase como título, sem repetir o texto',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);
      await abrirDiario(tester);

      expect(
        find.text('Acordei cedo e fiz a caminhada da manhã.'),
        findsOneWidget,
      );
      expect(find.textContaining('Acordei cedo'), findsOneWidget);
    },
  );
}
