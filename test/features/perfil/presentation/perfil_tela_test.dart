import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/autenticacao/presentation/sessao_providers.dart';
import 'package:shello/features/onboarding/domain/dados_onboarding.dart';
import 'package:shello/features/preferencias/domain/preferencias_usuario.dart';
import 'package:shello/features/preferencias/presentation/preferencias_providers.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  Future<void> abrirPerfil(WidgetTester tester) async {
    await tocar(tester, find.byKey(const Key('aba-perfil')));
  }

  testWidgets('escolher formalidade alta mostra a descrição correspondente', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await tocar(tester, find.byKey(const Key('formalidade-alta')));

    expect(
      find.textContaining('linguagem formal e profissional'),
      findsOneWidget,
    );
  });

  testWidgets('salvar o nome de referência mostra a confirmação', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await digitar(tester, const Key('campo-nome-referencia'), 'Duda');
    await tocar(tester, find.byKey(const Key('botao-salvar-nome')));

    expect(find.text('Nome salvo!'), findsOneWidget);
    await tocar(tester, find.text('Entendido'));
    expect(
      containerDoApp(tester).read(preferenciasProvider).nomeReferencia,
      'Duda',
    );
  });

  testWidgets('adicionar memória na tela de memórias a lista', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await rolarAte(tester, find.byKey(const Key('botao-ver-memorias')));
    await tocar(tester, find.byKey(const Key('botao-ver-memorias')));
    await digitar(
      tester,
      const Key('campo-nova-memoria'),
      'Quero correr uma maratona',
    );
    await tocar(tester, find.byKey(const Key('botao-salvar-memoria')));

    expect(find.text('Quero correr uma maratona'), findsOneWidget);
  });

  testWidgets('sair pede confirmação e leva à tela de autenticação', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await rolarAte(tester, find.byKey(const Key('botao-sair')));
    await tocar(tester, find.byKey(const Key('botao-sair')));
    expect(find.text('Sair da conta'), findsWidgets);

    await tocar(tester, find.text('Sim, sair'));
    expect(find.text('Bem-vindo de volta!'), findsOneWidget);
  });

  testWidgets('alternar o tema para escuro persiste a preferência', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await rolarAte(tester, find.byKey(const Key('alternar-tema')));
    await tocar(tester, find.byKey(const Key('alternar-tema')));

    expect(
      containerDoApp(tester).read(preferenciasProvider).tema,
      TemaApp.escuro,
    );
  });

  testWidgets(
    'conta criada pelo usuário não oferece restaurar a demonstração',
    (tester) async {
      final store = await armazenamentoComSessao();
      await subirApp(tester, store: store);
      await containerDoApp(tester)
          .read(sessaoProvider.notifier)
          .registrar(nome: 'Bia', email: 'bia@exemplo.com', senha: 'Senha@123');
      await containerDoApp(tester)
          .read(preferenciasProvider.notifier)
          .concluirOnboarding(
            const DadosOnboarding(nome: 'Bia', estiloDeVida: '', metaAtual: ''),
          );
      await aguardar(tester);
      await abrirPerfil(tester);

      expect(find.byKey(const Key('botao-restaurar-demo')), findsNothing);
    },
  );

  testWidgets('restaurar a demonstração devolve as entradas originais', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirPerfil(tester);

    await rolarAte(tester, find.byKey(const Key('botao-restaurar-demo')));
    await tocar(tester, find.byKey(const Key('botao-restaurar-demo')));
    await tocar(tester, find.text('Restaurar'));

    expect(find.text('Dados de demonstração restaurados.'), findsOneWidget);
  });
}
