import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/features/diario/domain/entrada_diario.dart';

void main() {
  group('título e prévia da entrada', () {
    test('a primeira frase vira o título e o restante vira a prévia', () {
      const conteudo = 'Acordei cedo. Senti a cabeça mais leve.';
      expect(tituloDaEntrada(conteudo), 'Acordei cedo.');
      expect(previaDaEntrada(conteudo), 'Senti a cabeça mais leve.');
    });

    test('entrada de uma frase só não tem prévia', () {
      expect(tituloDaEntrada('Dia cansativo.'), 'Dia cansativo.');
      expect(previaDaEntrada('Dia cansativo.'), isEmpty);
    });

    test('texto curto sem pontuação vira o próprio título', () {
      expect(tituloDaEntrada('Dia bom'), 'Dia bom');
      expect(previaDaEntrada('Dia bom'), isEmpty);
    });

    test('primeira frase longa não vira título: o texto inteiro vai para a prévia', () {
      const conteudo =
          'Hoje percebi que consigo organizar o dia melhor quando começo com uma lista curta. Quero manter.';
      expect(tituloDaEntrada(conteudo), isEmpty);
      expect(previaDaEntrada(conteudo), conteudo);
    });

    test('texto longo sem pontuação não vira título cortado no meio', () {
      final conteudo = List.filled(30, 'palavra').join(' ');
      expect(tituloDaEntrada(conteudo), isEmpty);
      expect(previaDaEntrada(conteudo).endsWith('...'), isTrue);
      expect(previaDaEntrada(conteudo).length, lessThanOrEqualTo(143));
    });

    test('título nunca termina com pontos repetidos', () {
      final conteudo = '${'a' * 39}. Resto do texto que continua depois';
      expect(tituloDaEntrada(conteudo), '${'a' * 39}.');
      expect(tituloDaEntrada(conteudo).contains('....'), isFalse);
    });
  });

  group('validarConteudoDiario', () {
    test('conteúdo vazio ou só com espaços é recusado', () {
      expect(
        () => validarConteudoDiario('   '),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test('conteúdo acima de 10.000 caracteres é recusado', () {
      expect(
        () => validarConteudoDiario('x' * 10001),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test('devolve o texto sem espaços nas bordas quando válido', () {
      expect(validarConteudoDiario('  Hoje foi bom  '), 'Hoje foi bom');
    });
  });

  group('EntradaDiario JSON', () {
    test('serialização preserva todos os campos', () {
      final entrada = EntradaDiario(
        id: 'e1',
        conteudo: 'Hoje finalizei o módulo.',
        dataCriacao: DateTime(2026, 6, 10, 9, 30),
        dataAtualizacao: DateTime(2026, 6, 10, 10),
      );
      final ida = EntradaDiario.fromJson(entrada.toJson());
      expect(ida.id, 'e1');
      expect(ida.conteudo, 'Hoje finalizei o módulo.');
      expect(ida.dataCriacao, DateTime(2026, 6, 10, 9, 30));
      expect(ida.dataAtualizacao, DateTime(2026, 6, 10, 10));
      expect(ida.titulo, 'Hoje finalizei o módulo.');
    });
  });
}
