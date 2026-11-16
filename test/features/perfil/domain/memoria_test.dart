import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/perfil/domain/memoria.dart';

void main() {
  group('classificarTipoMemoria (regras do ShelloContext original)', () {
    test('menções a pessoas viram RELACIONAMENTO', () {
      expect(
        classificarTipoMemoria('Meu amigo Pedro mora perto'),
        TipoMemoria.relacionamento,
      );
    });

    test('desejos e metas viram OBJETIVO', () {
      expect(
        classificarTipoMemoria('Quero aprender francês'),
        TipoMemoria.objetivo,
      );
    });

    test('hábitos recorrentes viram HABITO', () {
      expect(
        classificarTipoMemoria('Sempre acordo cedo aos sábados'),
        TipoMemoria.habito,
      );
    });

    test('gostos e aversões viram PREFERENCIA', () {
      expect(
        classificarTipoMemoria('Prefiro café sem açúcar'),
        TipoMemoria.preferencia,
      );
    });

    test('demais afirmações viram FATO', () {
      expect(
        classificarTipoMemoria('Trabalha como freelancer'),
        TipoMemoria.fato,
      );
    });
  });

  group('TipoMemoria.rotulo', () {
    test('usa os rótulos exibidos na tela de perfil', () {
      expect(TipoMemoria.habito.rotulo, 'HÁBITO');
      expect(TipoMemoria.relacionamento.rotulo, 'RELAÇÃO');
      expect(TipoMemoria.preferencia.rotulo, 'PREFERÊNCIA');
    });
  });

  group('Memoria.reflexaoDoDiario', () {
    test(
      'monta o conteúdo com prefixo e limita a 450 caracteres do original',
      () {
        final conteudo = 'a' * 500;
        final texto = Memoria.textoReflexao(conteudo);
        expect(texto, startsWith('Reflexão do diário: '));
        expect(texto.length, 'Reflexão do diário: '.length + 450);
      },
    );
  });
}
