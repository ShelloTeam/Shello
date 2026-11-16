import '../../../core/utils/datas.dart';

/// Origem de uma tarefa. Tarefas do chat seguem a regra D06 (data sempre nula).
enum OrigemTarefa { manual, chat }

/// Item de ação do usuário ("Sua Jornada").
class Tarefa {
  const Tarefa({
    required this.id,
    required this.titulo,
    required this.concluida,
    required this.dataCriacao,
    this.descricao,
    this.data,
    this.concluidaEm,
    this.origem = OrigemTarefa.manual,
  });

  final String id;
  final String titulo;
  final String? descricao;

  /// Data de vencimento no formato `yyyy-MM-dd`, sem horário nem fuso.
  final String? data;
  final bool concluida;
  final DateTime dataCriacao;
  final DateTime? concluidaEm;
  final OrigemTarefa origem;

  DateTime? get dataVencimento => data == null ? null : dataDeChave(data!);

  Tarefa copyWith({
    String? titulo,
    String? descricao,
    bool limparDescricao = false,
    String? data,
    bool limparData = false,
    bool? concluida,
    DateTime? concluidaEm,
    bool limparConclusao = false,
  }) {
    return Tarefa(
      id: id,
      titulo: titulo ?? this.titulo,
      descricao: limparDescricao ? null : (descricao ?? this.descricao),
      data: limparData ? null : (data ?? this.data),
      concluida: concluida ?? this.concluida,
      dataCriacao: dataCriacao,
      concluidaEm: limparConclusao ? null : (concluidaEm ?? this.concluidaEm),
      origem: origem,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'titulo': titulo,
    'descricao': descricao,
    'data': data,
    'concluida': concluida,
    'dataCriacao': dataCriacao.toIso8601String(),
    'concluidaEm': concluidaEm?.toIso8601String(),
    'origem': origem.name,
  };

  factory Tarefa.fromJson(Map<String, dynamic> json) => Tarefa(
    id: json['id'] as String,
    titulo: json['titulo'] as String,
    descricao: json['descricao'] as String?,
    data: json['data'] as String?,
    concluida: json['concluida'] as bool,
    dataCriacao: DateTime.parse(json['dataCriacao'] as String),
    concluidaEm: json['concluidaEm'] == null
        ? null
        : DateTime.parse(json['concluidaEm'] as String),
    origem: json['origem'] == OrigemTarefa.chat.name
        ? OrigemTarefa.chat
        : OrigemTarefa.manual,
  );
}
