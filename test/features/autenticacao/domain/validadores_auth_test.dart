import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/autenticacao/domain/validadores_auth.dart';

void main() {
  group('emailValido', () {
    test('aceita e-mail com domínio e espaços nas bordas', () {
      expect(emailValido('  ana@exemplo.com '), isTrue);
    });

    test('rejeita e-mail sem arroba ou sem domínio', () {
      expect(emailValido('ana.exemplo.com'), isFalse);
      expect(emailValido('ana@exemplo'), isFalse);
    });
  });

  group('senhaForte', () {
    test(
      'aceita senha com 8+ caracteres, maiúscula, minúscula, número e símbolo',
      () {
        expect(senhaForte('Demo@1234'), isTrue);
      },
    );

    test('rejeita senha sem símbolo', () {
      expect(senhaForte('Demo1234'), isFalse);
    });

    test('rejeita senha com menos de 8 caracteres', () {
      expect(senhaForte('Ab@1'), isFalse);
    });
  });

  group('validarLogin', () {
    test('e-mail vazio pede o preenchimento', () {
      expect(validarLogin(email: '  ', senha: 'x'), 'Preencha o e-mail.');
    });

    test('e-mail inválido pede e-mail válido', () {
      expect(
        validarLogin(email: 'ana', senha: 'x'),
        'Digite um e-mail válido.',
      );
    });

    test('senha vazia pede a senha', () {
      expect(
        validarLogin(email: 'ana@exemplo.com', senha: ''),
        'Preencha a senha.',
      );
    });

    test('dados válidos não geram mensagem', () {
      expect(validarLogin(email: 'ana@exemplo.com', senha: 'qualquer'), isNull);
    });
  });

  group('validarCadastro', () {
    test('nome vazio pede o nome', () {
      expect(
        validarCadastro(
          nome: ' ',
          email: 'a@b.com',
          senha: 'Demo@1234',
          confirmacao: 'Demo@1234',
        ),
        'Preencha seu nome.',
      );
    });

    test('senha fraca usa a mensagem de política de senha', () {
      expect(
        validarCadastro(
          nome: 'Ana',
          email: 'a@b.com',
          senha: 'fraca',
          confirmacao: 'fraca',
        ),
        'Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo (@\$!%*?&_-#).',
      );
    });

    test('confirmação diferente informa que as senhas não coincidem', () {
      expect(
        validarCadastro(
          nome: 'Ana',
          email: 'a@b.com',
          senha: 'Demo@1234',
          confirmacao: 'Demo@1235',
        ),
        'As senhas não coincidem.',
      );
    });

    test('cadastro válido não gera mensagem', () {
      expect(
        validarCadastro(
          nome: 'Ana',
          email: 'a@b.com',
          senha: 'Demo@1234',
          confirmacao: 'Demo@1234',
        ),
        isNull,
      );
    });
  });

  group('validarRecuperacao', () {
    test('e-mail inválido impede o envio do link', () {
      expect(validarRecuperacao('ana'), 'Digite um e-mail válido.');
    });
  });
}
