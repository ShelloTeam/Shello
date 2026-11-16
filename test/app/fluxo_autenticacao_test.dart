import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/autenticacao/data/autenticacao_repository.dart';

import '../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  testWidgets('sem sessão, o app abre na tela de autenticação', (tester) async {
    final store = await armazenamentoSemSessao();
    await subirApp(tester, store: store);

    expect(find.text('Bem-vindo de volta!'), findsOneWidget);
    expect(find.text('Shello'), findsOneWidget);
  });

  testWidgets('entrar sem preencher o e-mail mostra erro e não navega', (
    tester,
  ) async {
    final store = await armazenamentoSemSessao();
    await subirApp(tester, store: store);

    await tocar(tester, find.byKey(const Key('botao-principal-auth')));

    expect(find.text('Preencha o e-mail.'), findsOneWidget);
    expect(find.text('Bem-vindo de volta!'), findsOneWidget);
  });

  testWidgets('entrar com a conta de demonstração abre a Home com a saudação', (
    tester,
  ) async {
    final store = await armazenamentoSemSessao();
    await subirApp(tester, store: store);

    await digitar(tester, const Key('campo-email'), 'demo@exemplo.com');
    await digitar(tester, const Key('campo-senha'), 'Demo@1234');
    await tocar(tester, find.byKey(const Key('botao-principal-auth')));

    expect(find.text('ATALHOS RÁPIDOS'), findsOneWidget);
    expect(find.textContaining('Ana'), findsWidgets);
  });

  testWidgets('senha incorreta mostra a mensagem genérica de credenciais', (
    tester,
  ) async {
    final store = await armazenamentoSemSessao();
    await subirApp(tester, store: store);

    await digitar(tester, const Key('campo-email'), 'demo@exemplo.com');
    await digitar(tester, const Key('campo-senha'), 'Errada@999');
    await tocar(tester, find.byKey(const Key('botao-principal-auth')));

    expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
  });

  testWidgets('cadastro válido leva ao onboarding e concluir abre a Home', (
    tester,
  ) async {
    final store = await armazenamentoSemSessao();
    await subirApp(tester, store: store);

    await tocar(tester, find.byKey(const Key('alternar-cadastro')));
    await digitar(tester, const Key('campo-nome'), 'Bia');
    await digitar(tester, const Key('campo-email'), 'bia@exemplo.com');
    await digitar(tester, const Key('campo-senha'), 'Senha@123');
    await digitar(tester, const Key('campo-confirmacao'), 'Senha@123');
    await tocar(tester, find.byKey(const Key('botao-principal-auth')));

    expect(find.text('Como prefere ser chamado?'), findsOneWidget);
    expect(find.text('Etapa 1 de 3'), findsOneWidget);

    await digitar(tester, const Key('campo-onboarding'), 'Duda');
    await tocar(tester, find.byKey(const Key('botao-proximo-onboarding')));
    expect(find.text('Como descreveria seu estilo de vida?'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('botao-proximo-onboarding')));
    expect(find.text('O que está tentando melhorar agora?'), findsOneWidget);

    await tocar(tester, find.byKey(const Key('botao-proximo-onboarding')));
    expect(find.text('ATALHOS RÁPIDOS'), findsOneWidget);
    expect(find.textContaining('Duda'), findsWidgets);
  });

  testWidgets(
    'a sessão persiste: reabrir o app com sessão ativa vai direto à Home',
    (tester) async {
      final store = await armazenamentoDeDemonstracao();
      await AutenticacaoRepository(
        store: store,
        relogio: () => agoraDeTeste,
      ).entrar(email: 'demo@exemplo.com', senha: 'Demo@1234');
      await subirApp(tester, store: store);

      expect(find.text('ATALHOS RÁPIDOS'), findsOneWidget);
    },
  );
}
