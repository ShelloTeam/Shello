import 'key_value_store.dart';

/// Implementação em memória do [KeyValueStore], usada em testes e como
/// substituta segura quando o armazenamento persistente não está disponível.
class MemoriaKeyValueStore implements KeyValueStore {
  MemoriaKeyValueStore([Map<String, String>? inicial])
    : _dados = Map<String, String>.of(inicial ?? const {});

  final Map<String, String> _dados;

  @override
  String? ler(String chave) => _dados[chave];

  @override
  Future<void> gravar(String chave, String valor) async {
    _dados[chave] = valor;
  }

  @override
  Future<void> remover(String chave) async {
    _dados.remove(chave);
  }
}
