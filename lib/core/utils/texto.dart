/// Utilitários de texto puros, usados em buscas, classificação e títulos.
library;

const Map<String, String> _semAcento = {
  'á': 'a',
  'à': 'a',
  'â': 'a',
  'ã': 'a',
  'ä': 'a',
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'í': 'i',
  'ì': 'i',
  'î': 'i',
  'ï': 'i',
  'ó': 'o',
  'ò': 'o',
  'ô': 'o',
  'õ': 'o',
  'ö': 'o',
  'ú': 'u',
  'ù': 'u',
  'û': 'u',
  'ü': 'u',
  'ç': 'c',
  'ñ': 'n',
};

/// Minúsculas, sem acentos, com espaços colapsados. Usada em comparações.
String normalizarTexto(String texto) {
  final buffer = StringBuffer();
  for (final caractere in texto.toLowerCase().split('')) {
    buffer.write(_semAcento[caractere] ?? caractere);
  }
  return buffer.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
}

/// Deixa somente a primeira letra em maiúscula, preservando o restante.
String capitalizarPrimeiraLetra(String texto) {
  if (texto.isEmpty) return texto;
  return texto[0].toUpperCase() + texto.substring(1);
}

/// Corta o texto em [maximo] caracteres e acrescenta "..." quando excede.
String limitarComReticencias(String texto, int maximo) {
  if (texto.length <= maximo) return texto;
  return '${texto.substring(0, maximo)}...';
}
