import 'dart:convert';

import 'key_value_store.dart';

/// Coleção tipada persistida como lista JSON sob uma única chave.
///
/// Se o conteúdo armazenado estiver corrompido, a coleção é tratada como vazia
/// para que o aplicativo continue utilizável; a próxima gravação regrava a chave.
class ColecaoJson<T> {
  const ColecaoJson({
    required this.store,
    required this.chave,
    required this.deJson,
    required this.paraJson,
  });

  final KeyValueStore store;
  final String chave;
  final T Function(Map<String, dynamic> json) deJson;
  final Map<String, dynamic> Function(T item) paraJson;

  List<T> listar() {
    final bruto = store.ler(chave);
    if (bruto == null || bruto.isEmpty) return <T>[];
    try {
      final lista = jsonDecode(bruto) as List<dynamic>;
      return lista
          .map((item) => deJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on FormatException {
      return <T>[];
    } on TypeError {
      return <T>[];
    }
  }

  Future<void> salvar(List<T> itens) {
    return store.gravar(chave, jsonEncode(itens.map(paraJson).toList()));
  }
}
