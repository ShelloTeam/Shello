import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/autenticacao/presentation/sessao_providers.dart';
import 'package:shello/shared/widgets/shello_avatar.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  /// Conta nova: o cadastro leva direto ao onboarding.
  Future<void> abrirOnboarding(WidgetTester tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await containerDoApp(tester)
        .read(sessaoProvider.notifier)
        .registrar(nome: 'Bia', email: 'bia@exemplo.com', senha: 'Senha@123');
    await aguardar(tester);
  }

  testWidgets('o onboarding mostra o mascote no lugar dos ícones genéricos', (
    tester,
  ) async {
    await abrirOnboarding(tester);

    expect(find.byType(ShelloAvatar), findsWidgets);
    expect(
      find.byWidgetPredicate(
        (widget) => widget is Icon && widget.icon == Icons.person_outline,
      ),
      findsNothing,
    );
  });

  testWidgets('a nota de privacidade usa ícone, não emoji', (tester) async {
    await abrirOnboarding(tester);

    expect(find.textContaining('🔒'), findsNothing);
    expect(
      find.textContaining(
        'Suas informações ficam salvas apenas no seu dispositivo',
      ),
      findsOneWidget,
    );
  });

  testWidgets('na primeira etapa não há Voltar, e Próximo ocupa a largura', (
    tester,
  ) async {
    await abrirOnboarding(tester);

    expect(find.text('Voltar'), findsNothing);
  });
}
