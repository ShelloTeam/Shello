/// Armazenamento chave-valor local. Leituras são síncronas (dados já carregados
/// na inicialização); escritas são assíncronas e persistem entre execuções.
abstract interface class KeyValueStore {
  String? ler(String chave);

  Future<void> gravar(String chave, String valor);

  Future<void> remover(String chave);
}
