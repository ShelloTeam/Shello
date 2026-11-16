import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/utils/identificador.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../../perfil/presentation/perfil_providers.dart';
import '../../preferencias/presentation/preferencias_providers.dart';
import '../../tarefas/presentation/tarefas_providers.dart';
import '../domain/conversa.dart';
import '../domain/mensagem_chat.dart';
import '../domain/motor_respostas.dart';

/// Estado da tela de chat: conversa ativa, histórico arquivado e indicador de digitação.
class ChatEstado {
  const ChatEstado({
    this.conversa,
    this.historico = const [],
    this.digitando = false,
  });

  final Conversa? conversa;
  final List<Conversa> historico;
  final bool digitando;

  ChatEstado copyWith({
    Conversa? conversa,
    List<Conversa>? historico,
    bool? digitando,
  }) => ChatEstado(
    conversa: conversa ?? this.conversa,
    historico: historico ?? this.historico,
    digitando: digitando ?? this.digitando,
  );
}

final chatProvider = NotifierProvider<ChatController, ChatEstado>(
  ChatController.new,
);

class ChatController extends Notifier<ChatEstado> {
  static const MotorRespostas _motor = MotorRespostas();

  @override
  ChatEstado build() {
    ref.watch(sessaoProvider);
    return const ChatEstado();
  }

  Future<void> carregar(String nome) async {
    final repo = ref.read(chatRepositoryProvider);
    final conversa = await repo.garantirConversaAtiva(nome: nome);
    state = ChatEstado(conversa: conversa, historico: repo.historico());
  }

  /// Envia a pergunta e grava, junto, a resposta do Shello (troca atômica).
  /// Lança [ErroRegraNegocio] quando o limite de mensagens já foi atingido.
  Future<void> enviar(String texto) async {
    final mensagem = texto.trim();
    if (mensagem.isEmpty) return;
    final repo = ref.read(chatRepositoryProvider);
    final conversa =
        state.conversa ?? await repo.garantirConversaAtiva(nome: _nome());
    final agora = ref.read(relogioProvider)();

    final resposta = _motor.responder(mensagem, _contexto());
    final pergunta = MensagemChat(
      id: gerarId(),
      remetente: RemetenteChat.usuario,
      conteudo: mensagem,
      horario: agora,
    );
    final respostaShello = MensagemChat(
      id: gerarId(),
      remetente: RemetenteChat.shello,
      conteudo: resposta.texto,
      horario: agora,
      expressao: resposta.expressao,
      sugestaoTitulo: resposta.sugestaoTarefa?.titulo,
    );

    state = state.copyWith(digitando: true);
    try {
      await Future<void>.delayed(ref.read(atrasoDigitacaoProvider));
      await repo.adicionarMensagens(conversa.id, [pergunta, respostaShello]);
    } finally {
      state = ChatEstado(
        conversa: repo.conversaAtiva(),
        historico: repo.historico(),
      );
    }
  }

  /// Confirmação explícita do usuário: cria a tarefa (sem data) e marca a sugestão.
  Future<void> confirmarSugestao(String mensagemId) async {
    final conversa = state.conversa;
    if (conversa == null) return;
    MensagemChat? mensagem;
    for (final candidata in conversa.mensagens) {
      if (candidata.id == mensagemId) mensagem = candidata;
    }
    final titulo = mensagem?.sugestaoTitulo;
    if (mensagem == null || titulo == null || mensagem.sugestaoResolvida) {
      return;
    }

    await ref.read(tarefasProvider.notifier).adicionarDoChat([titulo]);
    final repo = ref.read(chatRepositoryProvider);
    await repo.marcarSugestaoResolvida(mensagemId);
    state = state.copyWith(conversa: repo.conversaAtiva());
  }

  /// Recusa a sugestão sem criar tarefa: apenas encerra o card.
  Future<void> recusarSugestao(String mensagemId) async {
    final repo = ref.read(chatRepositoryProvider);
    await repo.marcarSugestaoResolvida(mensagemId);
    state = state.copyWith(conversa: repo.conversaAtiva());
  }

  /// "Novo chat": arquiva a conversa atual e começa outra com a saudação.
  Future<void> novaConversa(String nome) async {
    final repo = ref.read(chatRepositoryProvider);
    await repo.arquivarAtiva();
    final nova = await repo.garantirConversaAtiva(nome: nome);
    state = ChatEstado(conversa: nova, historico: repo.historico());
  }

  String _nome() {
    final prefs = ref.read(preferenciasProvider);
    return prefs.nomeReferencia.isEmpty ? 'amigo' : prefs.nomeReferencia;
  }

  ContextoResposta _contexto() {
    final prefs = ref.read(preferenciasProvider);
    final memorias = ref.read(memoriasProvider).map((m) => m.conteudo).toList();
    return ContextoResposta(
      nome: _nome(),
      formalidade: prefs.formalidade,
      memorias: memorias,
    );
  }
}
