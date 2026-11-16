/// Chaves de armazenamento local. Centralizadas para que a seed de demonstração
/// e os repositórios usem exatamente as mesmas chaves.
abstract final class ChavesArmazenamento {
  static const String versaoEsquema = 'shello.versao';
  static const String contas = 'shello.contas';
  static const String sessao = 'shello.sessao';
  static const String preferencias = 'shello.preferencias';
  static const String entradas = 'shello.entradas';
  static const String memorias = 'shello.memorias';
  static const String tarefas = 'shello.tarefas';
  static const String rotinas = 'shello.rotinas';
  static const String conversas = 'shello.conversas';

  /// Chaves com dados de conta. O `EscopoContaKeyValueStore` as isola por conta.
  static const List<String> dadosDeConta = [
    preferencias,
    entradas,
    memorias,
    tarefas,
    rotinas,
    conversas,
  ];

  /// Versão atual do formato dos dados. Incremente ao mudar um modelo persistido.
  /// 2: dados separados por conta. A versão 1 os guardava juntos, sem dono.
  static const int versaoAtual = 2;
}
