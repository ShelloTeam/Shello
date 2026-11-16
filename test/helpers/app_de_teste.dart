import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shello/app/app.dart';
import 'package:shello/core/bootstrap.dart';
import 'package:shello/features/autenticacao/data/autenticacao_repository.dart';
import 'package:shello/core/providers.dart';
import 'package:shello/core/storage/chaves_armazenamento.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';

/// Data fixa usada pelos testes de interface (10 de junho de 2026, 15h).
final DateTime agoraDeTeste = DateTime(2026, 6, 10, 15);

/// Garante os símbolos de data em português para toda a suíte de interface.
Future<void> prepararLocaleDeTeste() => initializeDateFormatting('pt_BR');

/// Armazenamento com a demonstração instalada, como na primeira execução real.
Future<MemoriaKeyValueStore> armazenamentoDeDemonstracao() async {
  final store = MemoriaKeyValueStore();
  await prepararArmazenamento(store: store, relogio: () => agoraDeTeste);
  return store;
}

/// Armazenamento com a demonstração e uma sessão ativa (usuário já autenticado).
Future<MemoriaKeyValueStore> armazenamentoComSessao() async {
  final store = await armazenamentoDeDemonstracao();
  await AutenticacaoRepository(
    store: store,
    relogio: () => agoraDeTeste,
  ).entrar(email: 'demo@exemplo.com', senha: 'Demo@1234');
  return store;
}

/// Armazenamento sem sessão: o app abre na tela de autenticação.
Future<MemoriaKeyValueStore> armazenamentoSemSessao() async {
  final store = await armazenamentoDeDemonstracao();
  await store.remover(ChavesArmazenamento.sessao);
  return store;
}

/// Sobe o aplicativo completo com dependências de teste.
Future<void> subirApp(
  WidgetTester tester, {
  required MemoriaKeyValueStore store,
  DateTime? agora,
}) async {
  final instante = agora ?? agoraDeTeste;
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        keyValueStoreProvider.overrideWithValue(store),
        relogioProvider.overrideWithValue(() => instante),
        atrasoDigitacaoProvider.overrideWithValue(Duration.zero),
      ],
      child: const ShelloApp(),
    ),
  );
  await aguardar(tester);
}

/// Avança o tempo em passos curtos até as animações terminarem.
/// Evita `pumpAndSettle`, que não termina quando há animações contínuas (ex.: pulsação).
Future<void> aguardar(WidgetTester tester, {int ciclos = 25}) async {
  for (var i = 0; i < ciclos; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

/// Rola até encontrar o widget (listas longas com itens fora da área visível).
Future<void> rolarAte(
  WidgetTester tester,
  Finder alvo, {
  Finder? rolagem,
}) async {
  await tester.scrollUntilVisible(
    alvo,
    300,
    scrollable: rolagem ?? find.byType(Scrollable).first,
  );
  await aguardar(tester, ciclos: 5);
}

/// Acesso à Widget tree com o `ProviderContainer` real do app, para verificar estado.
ProviderContainer containerDoApp(WidgetTester tester) {
  return ProviderScope.containerOf(tester.element(find.byType(ShelloApp)));
}

/// Digita em um campo identificado por Key e aguarda a atualização.
Future<void> digitar(WidgetTester tester, Key chave, String texto) async {
  await tester.enterText(find.byKey(chave), texto);
  await aguardar(tester, ciclos: 2);
}

/// Toca em um elemento visível e aguarda a animação resultante.
Future<void> tocar(WidgetTester tester, Finder alvo) async {
  await tester.ensureVisible(alvo);
  await tester.tap(alvo);
  await aguardar(tester);
}
