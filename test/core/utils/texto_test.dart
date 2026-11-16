import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/utils/texto.dart';

void main() {
  group('normalizarTexto', () {
    test('remove acentos, põe em minúsculas e colapsa espaços', () {
      expect(normalizarTexto('  Café   Ótimo  '), 'cafe otimo');
    });

    test('mantém cedilha convertida para c', () {
      expect(normalizarTexto('Conversação'), 'conversacao');
    });
  });

  group('capitalizarPrimeiraLetra', () {
    test('deixa apenas a primeira letra maiúscula preservando o restante', () {
      expect(
        capitalizarPrimeiraLetra('revisar relatório'),
        'Revisar relatório',
      );
    });

    test('texto vazio é devolvido sem alteração', () {
      expect(capitalizarPrimeiraLetra(''), '');
    });
  });

  group('limitarComReticencias', () {
    test('corta em n caracteres e acrescenta reticências quando excede', () {
      expect(limitarComReticencias('abcdefghij', 4), 'abcd...');
    });

    test('não acrescenta reticências quando cabe no limite', () {
      expect(limitarComReticencias('abc', 4), 'abc');
    });
  });
}
