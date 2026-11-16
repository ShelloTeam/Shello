import '../../../core/utils/texto.dart';

/// Categoria de uma memória que o Shello guarda sobre o usuário.
enum TipoMemoria {
  preferencia('PREFERÊNCIA'),
  fato('FATO'),
  objetivo('OBJETIVO'),
  habito('HÁBITO'),
  contexto('CONTEXTO'),
  relacionamento('RELAÇÃO');

  const TipoMemoria(this.rotulo);

  final String rotulo;

  static TipoMemoria porNome(String nome) => TipoMemoria.values.firstWhere(
    (t) => t.name == nome,
    orElse: () => TipoMemoria.fato,
  );
}

final RegExp _relacionamento = RegExp(
  r'amig|namorad|familia|familiar|colega|conhec|encontr|pessoa|\bpai\b|\bmae\b|irmao|irma|filho|filha',
);
final RegExp _objetivo = RegExp(
  r'quer[oe]|desej|objetivo|\bmeta\b|plan[eo]|pretend|vontade|sonho|quero melhorar|quero aprender',
);
final RegExp _habito = RegExp(
  r'sempre|todo dia|rotina|habito|costumo|geralmente|frequen|regularmente|diariamente',
);
// "prefir" cobre a conjugação "prefiro", que a regra original não reconhecia.
final RegExp _preferencia = RegExp(
  r'prefer|prefir|gost[ao]|\bamo\b|adoro|nao gost|detesto|favorit',
);

/// Classifica um texto livre na categoria de memória, pelas mesmas regras
/// de palavra-chave da versão React Native (ordem de prioridade preservada).
TipoMemoria classificarTipoMemoria(String conteudo) {
  final texto = normalizarTexto(conteudo);
  if (_relacionamento.hasMatch(texto)) return TipoMemoria.relacionamento;
  if (_objetivo.hasMatch(texto)) return TipoMemoria.objetivo;
  if (_habito.hasMatch(texto)) return TipoMemoria.habito;
  if (_preferencia.hasMatch(texto)) return TipoMemoria.preferencia;
  return TipoMemoria.fato;
}

/// Uma memória de contexto. Quando nasce de uma entrada do diário, guarda o id
/// da entrada em [origemEntradaId] — vínculo explícito, sem comparar textos.
class Memoria {
  const Memoria({
    required this.id,
    required this.tipo,
    required this.conteudo,
    required this.dataCriacao,
    this.origemEntradaId,
  });

  /// Limite de caracteres do conteúdo de uma reflexão, herdado do original.
  static const int limiteReflexao = 450;
  static const String prefixoReflexao = 'Reflexão do diário: ';

  final String id;
  final TipoMemoria tipo;
  final String conteudo;
  final DateTime dataCriacao;
  final String? origemEntradaId;

  /// Texto da memória criada a partir de uma entrada do diário.
  static String textoReflexao(String conteudoEntrada) {
    final recorte = conteudoEntrada.length > limiteReflexao
        ? conteudoEntrada.substring(0, limiteReflexao)
        : conteudoEntrada;
    return '$prefixoReflexao$recorte';
  }

  Memoria copyWith({TipoMemoria? tipo, String? conteudo}) => Memoria(
    id: id,
    tipo: tipo ?? this.tipo,
    conteudo: conteudo ?? this.conteudo,
    dataCriacao: dataCriacao,
    origemEntradaId: origemEntradaId,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'tipo': tipo.name,
    'conteudo': conteudo,
    'dataCriacao': dataCriacao.toIso8601String(),
    'origemEntradaId': origemEntradaId,
  };

  factory Memoria.fromJson(Map<String, dynamic> json) => Memoria(
    id: json['id'] as String,
    tipo: TipoMemoria.porNome(json['tipo'] as String),
    conteudo: json['conteudo'] as String,
    dataCriacao: DateTime.parse(json['dataCriacao'] as String),
    origemEntradaId: json['origemEntradaId'] as String?,
  );
}
