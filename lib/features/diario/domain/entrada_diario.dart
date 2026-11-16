import '../../../core/domain/erro_regra_negocio.dart';

/// Limite de caracteres de uma anotação (regra 2.1 das regras de negócio).
const int limiteCaracteresDiario = 10000;

const int _limiteTitulo = 60;
const int _limitePrevia = 140;

/// Título da entrada: só a primeira frase, quando é curta e completa.
/// Sem frase curta, a entrada não tem título: o texto inteiro vai para a prévia.
String tituloDaEntrada(String conteudo) => _dividir(conteudo).titulo;

/// Prévia da entrada: o texto que não está no título, cortado em palavra inteira.
String previaDaEntrada(String conteudo) => _dividir(conteudo).previa;

({String titulo, String previa}) _dividir(String conteudo) {
  final texto = conteudo.trim();
  final fimDaFrase = RegExp(r'[.!?](?=\s|$)|\n').firstMatch(texto);
  if (fimDaFrase != null && fimDaFrase.start < _limiteTitulo) {
    final pontuacao = texto[fimDaFrase.start] == '\n' ? 0 : 1;
    return (
      titulo: texto.substring(0, fimDaFrase.start + pontuacao).trimRight(),
      previa: _cortarPrevia(texto.substring(fimDaFrase.end)),
    );
  }
  if (texto.length <= _limiteTitulo) return (titulo: texto, previa: '');
  return (titulo: '', previa: _cortarPrevia(texto));
}

String _cortarPrevia(String resto) {
  final texto = resto.trim();
  if (texto.length <= _limitePrevia) return texto;
  final espaco = texto.lastIndexOf(' ', _limitePrevia);
  final corte = espaco > 0 ? espaco : _limitePrevia;
  return '${texto.substring(0, corte).trimRight()}...';
}

/// Valida e normaliza o texto de uma anotação. Retorna o texto sem espaços nas bordas.
String validarConteudoDiario(String conteudo) {
  final texto = conteudo.trim();
  if (texto.isEmpty) {
    throw const ErroRegraNegocio('Conteúdo não pode ser vazio.');
  }
  if (texto.length > limiteCaracteresDiario) {
    throw const ErroRegraNegocio(
      'Conteúdo deve ter no máximo 10.000 caracteres.',
    );
  }
  return texto;
}

/// Anotação do diário. O estado "no contexto do Shello" não é guardado aqui:
/// é derivado da existência de uma memória vinculada (sem estado duplicado).
class EntradaDiario {
  const EntradaDiario({
    required this.id,
    required this.conteudo,
    required this.dataCriacao,
    this.dataAtualizacao,
  });

  final String id;
  final String conteudo;
  final DateTime dataCriacao;
  final DateTime? dataAtualizacao;

  String get titulo => tituloDaEntrada(conteudo);

  String get previa => previaDaEntrada(conteudo);

  /// Entradas com mais de 100 caracteres são "lidas" pelo Shello.
  bool get mereceAnalise => conteudo.length > 100;

  EntradaDiario copyWith({String? conteudo, DateTime? dataAtualizacao}) =>
      EntradaDiario(
        id: id,
        conteudo: conteudo ?? this.conteudo,
        dataCriacao: dataCriacao,
        dataAtualizacao: dataAtualizacao ?? this.dataAtualizacao,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'conteudo': conteudo,
    'dataCriacao': dataCriacao.toIso8601String(),
    'dataAtualizacao': dataAtualizacao?.toIso8601String(),
  };

  factory EntradaDiario.fromJson(Map<String, dynamic> json) => EntradaDiario(
    id: json['id'] as String,
    conteudo: json['conteudo'] as String,
    dataCriacao: DateTime.parse(json['dataCriacao'] as String),
    dataAtualizacao: json['dataAtualizacao'] == null
        ? null
        : DateTime.parse(json['dataAtualizacao'] as String),
  );
}
