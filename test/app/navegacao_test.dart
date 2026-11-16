import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  testWidgets(
    'a barra inferior tem cinco destinos com o botão central do chat',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);

      final barra = find.byKey(const Key('barra-navegacao'));
      expect(barra, findsOneWidget);
      expect(
        find.descendant(of: barra, matching: find.text('Início')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: barra, matching: find.text('Diário')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: barra, matching: find.text('Tarefas')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: barra, matching: find.text('Perfil')),
        findsOneWidget,
      );
      expect(find.byKey(const Key('aba-chat')), findsOneWidget);
    },
  );

  testWidgets('tocar nas abas troca a tela principal', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);

    await tocar(tester, find.byKey(const Key('aba-diario')));
    expect(find.text('Meu Diário'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('aba-tarefas')));
    expect(find.text('Sua Jornada'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('aba-perfil')));
    expect(find.text('Meu Perfil & Contexto da IA'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('aba-chat')));
    expect(find.text('Seu Companheiro de IA'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('aba-inicio')));
    expect(find.text('ATALHOS RÁPIDOS'), findsOneWidget);
  });
}
