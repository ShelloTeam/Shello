/// Período do dia de uma rotina. Define a seção em que a rotina aparece.
enum PeriodoRotina {
  manha('Manhã'),
  tarde('Tarde'),
  noite('Noite');

  const PeriodoRotina(this.rotulo);

  final String rotulo;

  static PeriodoRotina porNome(String nome) => PeriodoRotina.values.firstWhere(
    (p) => p.name == nome,
    orElse: () => PeriodoRotina.manha,
  );
}

/// Rotina diária: um conjunto de atividades agrupado por período do dia.
class Rotina {
  const Rotina({
    required this.id,
    required this.titulo,
    required this.atividades,
    required this.periodo,
  });

  final String id;
  final String titulo;
  final List<String> atividades;
  final PeriodoRotina periodo;

  Rotina copyWith({
    String? titulo,
    List<String>? atividades,
    PeriodoRotina? periodo,
  }) => Rotina(
    id: id,
    titulo: titulo ?? this.titulo,
    atividades: atividades ?? this.atividades,
    periodo: periodo ?? this.periodo,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'titulo': titulo,
    'atividades': atividades,
    'periodo': periodo.name,
  };

  factory Rotina.fromJson(Map<String, dynamic> json) => Rotina(
    id: json['id'] as String,
    titulo: json['titulo'] as String,
    atividades: (json['atividades'] as List<dynamic>).cast<String>(),
    periodo: PeriodoRotina.porNome(json['periodo'] as String),
  );
}
