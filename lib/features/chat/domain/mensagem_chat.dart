import 'motor_respostas.dart';

enum RemetenteChat { usuario, shello }

/// Mensagem de uma conversa. `ehBoasVindas` marca a saudação inicial, que não
/// conta no limite de mensagens (igual ao comportamento da versão original).
class MensagemChat {
  const MensagemChat({
    required this.id,
    required this.remetente,
    required this.conteudo,
    required this.horario,
    this.expressao,
    this.sugestaoTitulo,
    this.sugestaoResolvida = false,
    this.ehBoasVindas = false,
  });

  final String id;
  final RemetenteChat remetente;
  final String conteudo;
  final DateTime horario;
  final ExpressaoShello? expressao;
  final String? sugestaoTitulo;
  final bool sugestaoResolvida;
  final bool ehBoasVindas;

  bool get temSugestaoPendente => sugestaoTitulo != null && !sugestaoResolvida;

  MensagemChat copyWith({bool? sugestaoResolvida}) => MensagemChat(
    id: id,
    remetente: remetente,
    conteudo: conteudo,
    horario: horario,
    expressao: expressao,
    sugestaoTitulo: sugestaoTitulo,
    sugestaoResolvida: sugestaoResolvida ?? this.sugestaoResolvida,
    ehBoasVindas: ehBoasVindas,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'remetente': remetente.name,
    'conteudo': conteudo,
    'horario': horario.toIso8601String(),
    'expressao': expressao?.name,
    'sugestaoTitulo': sugestaoTitulo,
    'sugestaoResolvida': sugestaoResolvida,
    'ehBoasVindas': ehBoasVindas,
  };

  factory MensagemChat.fromJson(Map<String, dynamic> json) => MensagemChat(
    id: json['id'] as String,
    remetente: RemetenteChat.values.byName(json['remetente'] as String),
    conteudo: json['conteudo'] as String,
    horario: DateTime.parse(json['horario'] as String),
    expressao: json['expressao'] == null
        ? null
        : ExpressaoShello.values.byName(json['expressao'] as String),
    sugestaoTitulo: json['sugestaoTitulo'] as String?,
    sugestaoResolvida: json['sugestaoResolvida'] as bool? ?? false,
    ehBoasVindas: json['ehBoasVindas'] as bool? ?? false,
  );
}
