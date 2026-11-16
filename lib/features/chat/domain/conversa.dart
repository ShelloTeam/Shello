import 'mensagem_chat.dart';

/// Ativa aceita mensagens. Arquivada é somente leitura (histórico).
enum StatusConversa { ativa, arquivada }

class Conversa {
  const Conversa({
    required this.id,
    required this.status,
    required this.mensagens,
    required this.criadaEm,
    required this.ultimaAtividade,
  });

  final String id;
  final StatusConversa status;
  final List<MensagemChat> mensagens;
  final DateTime criadaEm;
  final DateTime ultimaAtividade;

  /// Mensagens que contam no limite: tudo exceto a saudação inicial.
  int get mensagensContaveis => mensagens.where((m) => !m.ehBoasVindas).length;

  Conversa copyWith({
    StatusConversa? status,
    List<MensagemChat>? mensagens,
    DateTime? ultimaAtividade,
  }) => Conversa(
    id: id,
    status: status ?? this.status,
    mensagens: mensagens ?? this.mensagens,
    criadaEm: criadaEm,
    ultimaAtividade: ultimaAtividade ?? this.ultimaAtividade,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'status': status.name,
    'mensagens': mensagens.map((m) => m.toJson()).toList(),
    'criadaEm': criadaEm.toIso8601String(),
    'ultimaAtividade': ultimaAtividade.toIso8601String(),
  };

  factory Conversa.fromJson(Map<String, dynamic> json) => Conversa(
    id: json['id'] as String,
    status: StatusConversa.values.byName(json['status'] as String),
    mensagens: (json['mensagens'] as List<dynamic>)
        .map((m) => MensagemChat.fromJson(m as Map<String, dynamic>))
        .toList(),
    criadaEm: DateTime.parse(json['criadaEm'] as String),
    ultimaAtividade: DateTime.parse(json['ultimaAtividade'] as String),
  );
}
