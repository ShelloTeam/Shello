import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/chat/data/chat_repository.dart';
import 'package:shello/features/chat/domain/conversa.dart';
import 'package:shello/features/chat/domain/mensagem_chat.dart';

MensagemChat mensagemUsuario(String texto, DateTime quando) => MensagemChat(
  id: 'm-$texto',
  remetente: RemetenteChat.usuario,
  conteudo: texto,
  horario: quando,
);

void main() {
  var agora = DateTime(2026, 6, 10, 10);
  late MemoriaKeyValueStore store;

  ChatRepository repo() => ChatRepository(store: store, relogio: () => agora);

  setUp(() {
    store = MemoriaKeyValueStore();
    agora = DateTime(2026, 6, 10, 10);
  });

  test(
    'garantirConversaAtiva cria uma conversa com a mensagem de boas-vindas',
    () async {
      final conversa = await repo().garantirConversaAtiva(nome: 'Ana');
      expect(conversa.status, StatusConversa.ativa);
      expect(conversa.mensagens.single.ehBoasVindas, isTrue);
      expect(conversa.mensagens.single.conteudo, contains('Ana'));
    },
  );

  test(
    'a mensagem de boas-vindas não conta no limite de 20 mensagens',
    () async {
      final r = repo();
      await r.garantirConversaAtiva(nome: 'Ana');
      expect(r.contarMensagensPersistidas(), 0);
    },
  );

  test('mensagens adicionadas sobrevivem à reabertura', () async {
    final r = repo();
    final conversa = await r.garantirConversaAtiva(nome: 'Ana');
    await r.adicionarMensagens(conversa.id, [mensagemUsuario('oi', agora)]);

    final reaberto = repo().conversaAtiva();
    expect(reaberto!.mensagens.map((m) => m.conteudo), contains('oi'));
    expect(reaberto.mensagens.length, 2);
  });

  test(
    'não aceita novas mensagens quando o limite de 20 foi atingido',
    () async {
      final r = repo();
      final conversa = await r.garantirConversaAtiva(nome: 'Ana');
      await r.adicionarMensagens(conversa.id, [
        for (var i = 0; i < 20; i++) mensagemUsuario('msg $i', agora),
      ]);
      expect(
        () => r.adicionarMensagens(conversa.id, [mensagemUsuario('21', agora)]),
        throwsA(isA<ErroRegraNegocio>()),
      );
    },
  );

  test('novo chat arquiva a conversa atual e inicia outra vazia', () async {
    final r = repo();
    final primeira = await r.garantirConversaAtiva(nome: 'Ana');
    await r.arquivarAtiva();

    final historico = r.historico();
    expect(historico.single.id, primeira.id);
    expect(historico.single.status, StatusConversa.arquivada);

    final nova = await r.garantirConversaAtiva(nome: 'Ana');
    expect(nova.id, isNot(primeira.id));
    expect(nova.status, StatusConversa.ativa);
  });

  test(
    'conversa sem atividade há mais de 2 horas é arquivada automaticamente',
    () async {
      final r = repo();
      await r.garantirConversaAtiva(nome: 'Ana');
      agora = agora.add(const Duration(hours: 2, minutes: 5));

      expect(repo().conversaAtiva(), isNull);
      expect(repo().historico().single.status, StatusConversa.arquivada);
    },
  );

  test('conversa arquivada não recebe novas mensagens', () async {
    final r = repo();
    final conversa = await r.garantirConversaAtiva(nome: 'Ana');
    await r.arquivarAtiva();
    expect(
      () => r.adicionarMensagens(conversa.id, [
        mensagemUsuario('tarde demais', agora),
      ]),
      throwsA(isA<ErroRegraNegocio>()),
    );
  });

  test('sugestão de tarefa pode ser marcada como resolvida', () async {
    final r = repo();
    final conversa = await r.garantirConversaAtiva(nome: 'Ana');
    final sugestao = MensagemChat(
      id: 'sug-1',
      remetente: RemetenteChat.shello,
      conteudo: 'Preparei a tarefa abaixo.',
      horario: agora,
      sugestaoTitulo: 'Comprar pão',
    );
    await r.adicionarMensagens(conversa.id, [sugestao]);
    await r.marcarSugestaoResolvida('sug-1');
    final msg = repo().conversaAtiva()!.mensagens.firstWhere(
      (m) => m.id == 'sug-1',
    );
    expect(msg.sugestaoResolvida, isTrue);
  });
}
