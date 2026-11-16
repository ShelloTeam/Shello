import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/formalidade.dart';
import 'package:shello/features/chat/domain/motor_respostas.dart';

void main() {
  const motor = MotorRespostas();

  ContextoResposta contexto({
    String nome = 'Ana',
    Formalidade formalidade = Formalidade.media,
    List<String> memorias = const [],
  }) => ContextoResposta(
    nome: nome,
    formalidade: formalidade,
    memorias: memorias,
  );

  group('detectarModo', () {
    test('palavra de ação ativa o modo PRATICO', () {
      expect(
        motor.detectarModo('quero criar tarefa para amanhã'),
        ModoChat.pratico,
      );
    });

    test('mensagem comum usa o modo PADRAO', () {
      expect(motor.detectarModo('como você está hoje?'), ModoChat.padrao);
    });

    test('a detecção ignora maiúsculas e acentos', () {
      expect(motor.detectarModo('CRIAR TAREFA urgente'), ModoChat.pratico);
      expect(motor.detectarModo('Preciso de um lembrete'), ModoChat.pratico);
    });
  });

  group('extrairTituloTarefa', () {
    test(
      'remove o pedido e preserva o conteúdo, com a primeira letra maiúscula',
      () {
        expect(
          motor.extrairTituloTarefa(
            'quero criar tarefa para revisar o relatório',
          ),
          'Revisar o relatório',
        );
      },
    );

    test('aceita dois pontos como separador do título', () {
      expect(
        motor.extrairTituloTarefa('criar uma tarefa: comprar pão'),
        'Comprar pão',
      );
    });

    test('sem conteúdo após o pedido não há título sugerido', () {
      expect(motor.extrairTituloTarefa('criar tarefa'), isNull);
    });
  });

  group('responder', () {
    test('mensagem PRATICO com título gera sugestão de tarefa sem data', () {
      final resposta = motor.responder('criar tarefa comprar pão', contexto());
      expect(resposta.modo, ModoChat.pratico);
      expect(resposta.sugestaoTarefa, isNotNull);
      expect(resposta.sugestaoTarefa!.titulo, 'Comprar pão');
    });

    test('mensagem PRATICO sem título pede o detalhe e não sugere tarefa', () {
      final resposta = motor.responder('criar tarefa', contexto());
      expect(resposta.sugestaoTarefa, isNull);
      expect(resposta.texto, contains('o que você quer'));
    });

    test('é determinístico: mesma entrada gera mesma resposta', () {
      final a = motor.responder('estou cansado hoje', contexto());
      final b = motor.responder('estou cansado hoje', contexto());
      expect(a.texto, b.texto);
      expect(a.expressao, b.expressao);
    });

    test('inclui o nome de referência do usuário', () {
      final resposta = motor.responder('oi', contexto(nome: 'Ana'));
      expect(resposta.texto, contains('Ana'));
    });

    test('formalidade altera o tom da resposta', () {
      final baixa = motor.responder(
        'oi',
        contexto(formalidade: Formalidade.baixa),
      );
      final alta = motor.responder(
        'oi',
        contexto(formalidade: Formalidade.alta),
      );
      expect(baixa.texto, isNot(alta.texto));
    });

    test('resposta usa memória relevante do contexto do usuário', () {
      final resposta = motor.responder(
        'estou pensando em correr hoje',
        contexto(memorias: ['Quero correr uma maratona no próximo ano']),
      );
      expect(resposta.texto, contains('maratona'));
    });

    test('sentimento difícil recebe acolhimento com expressão duvidosa', () {
      final resposta = motor.responder('estou muito triste hoje', contexto());
      expect(resposta.expressao, ExpressaoShello.duvidoso);
    });

    test('agradecimento recebe expressão feliz', () {
      final resposta = motor.responder('muito obrigado pela ajuda', contexto());
      expect(resposta.expressao, ExpressaoShello.feliz);
    });

    test('nunca apresenta a resposta como gerada por IA real', () {
      final resposta = motor.responder('oi', contexto());
      expect(resposta.texto.toLowerCase(), isNot(contains('gpt')));
      expect(
        resposta.texto.toLowerCase(),
        isNot(contains('inteligência artificial')),
      );
    });
  });

  group('RegrasConversa', () {
    test('uma conversa aceita até 20 mensagens persistidas', () {
      expect(RegrasConversa.podeEnviar(19), isTrue);
      expect(RegrasConversa.podeEnviar(20), isFalse);
    });

    test('conversa com mais de 2 horas de inatividade deve ser arquivada', () {
      final agora = DateTime(2026, 6, 10, 15);
      expect(
        RegrasConversa.deveArquivar(
          agora.subtract(const Duration(hours: 2, minutes: 1)),
          agora,
        ),
        isTrue,
      );
    });

    test('exatamente 2 horas de inatividade ainda não arquiva', () {
      final agora = DateTime(2026, 6, 10, 15);
      expect(
        RegrasConversa.deveArquivar(
          agora.subtract(const Duration(hours: 2)),
          agora,
        ),
        isFalse,
      );
    });
  });
}
