import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/inicio/domain/estatisticas.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 15, 30);

  group('calcularSequenciaDias', () {
    test('sem entradas a sequência é zero', () {
      expect(calcularSequenciaDias(const [], agora), 0);
    });

    test('conta hoje, ontem e anteontem como três dias seguidos', () {
      final datas = [
        DateTime(2026, 6, 10, 9),
        DateTime(2026, 6, 9, 21),
        DateTime(2026, 6, 8, 8),
      ];
      expect(calcularSequenciaDias(datas, agora), 3);
    });

    test('sem entrada hoje, a sequência começa ontem (ainda no prazo)', () {
      final datas = [DateTime(2026, 6, 9, 10), DateTime(2026, 6, 8, 10)];
      expect(calcularSequenciaDias(datas, agora), 2);
    });

    test('quebra de dia zera a sequência a partir do ponto de ruptura', () {
      final datas = [
        DateTime(2026, 6, 10, 10),
        DateTime(2026, 6, 9, 10),
        DateTime(2026, 6, 7, 10), // 8 de junho ausente
      ];
      expect(calcularSequenciaDias(datas, agora), 2);
    });

    test('várias entradas no mesmo dia contam como um único dia', () {
      final datas = [
        DateTime(2026, 6, 10, 8),
        DateTime(2026, 6, 10, 9),
        DateTime(2026, 6, 10, 22),
      ];
      expect(calcularSequenciaDias(datas, agora), 1);
    });

    test('última entrada há três dias não gera sequência', () {
      expect(calcularSequenciaDias([DateTime(2026, 6, 7, 10)], agora), 0);
    });
  });

  group('saudacaoPorHorario', () {
    test('manhã entre 5h e 11h59 diz "Bom dia,"', () {
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 5)), 'Bom dia,');
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 11, 59)), 'Bom dia,');
    });

    test('tarde entre 12h e 17h59 diz "Boa tarde,"', () {
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 12)), 'Boa tarde,');
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 17, 59)), 'Boa tarde,');
    });

    test('demais horários dizem "Boa noite,"', () {
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 18)), 'Boa noite,');
      expect(saudacaoPorHorario(DateTime(2026, 6, 10, 2)), 'Boa noite,');
    });
  });

  group('contarTarefasConcluidasHoje', () {
    test('considera apenas tarefas concluídas no dia de referência', () {
      final concluidas = [DateTime(2026, 6, 10, 8), DateTime(2026, 6, 9, 20)];
      expect(contarConcluidasNoDia(concluidas, agora), 1);
    });
  });

  group('diasDaSemanaComEntrada', () {
    test('a faixa tem sete posições, da mais antiga até hoje', () {
      expect(diasDaSemanaComEntrada(const [], agora), hasLength(7));
    });

    test(
      'marca somente os dias que têm entrada, com hoje na última posição',
      () {
        final datas = [DateTime(2026, 6, 10, 9), DateTime(2026, 6, 8, 20)];
        expect(diasDaSemanaComEntrada(datas, agora), [
          false,
          false,
          false,
          false,
          true,
          false,
          true,
        ]);
      },
    );

    test('entradas anteriores à janela de sete dias são ignoradas', () {
      expect(
        diasDaSemanaComEntrada([DateTime(2026, 6, 1, 9)], agora),
        everyElement(isFalse),
      );
    });
  });
}
