import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/autenticacao/domain/sessao_usuario.dart';

void main() {
  test('a conta de demonstração é reconhecida pelo e-mail', () {
    const sessao = SessaoUsuario(
      id: 'conta-x',
      nome: 'Ana',
      email: 'demo@exemplo.com',
    );
    expect(sessao.ehDemonstracao, isTrue);
  });

  test('uma conta criada pelo usuário não é a conta de demonstração', () {
    const sessao = SessaoUsuario(
      id: 'conta-y',
      nome: 'Bia',
      email: 'bia@exemplo.com',
    );
    expect(sessao.ehDemonstracao, isFalse);
  });
}
