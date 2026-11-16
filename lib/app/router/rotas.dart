/// Caminhos da navegação. Centralizados para que telas e testes usem as mesmas rotas.
abstract final class Rotas {
  static const String autenticacao = '/autenticacao';
  static const String onboarding = '/onboarding';

  static const String inicio = '/inicio';

  static const String diario = '/diario';
  static const String novaEntrada = '/diario/nova';
  static String entrada(String id) => '/diario/$id';

  static const String chat = '/chat';
  static const String historicoChat = '/chat/historico';
  static String conversaArquivada(String id) => '/chat/historico/$id';

  static const String tarefas = '/tarefas';

  static const String perfil = '/perfil';
  static const String memorias = '/perfil/memorias';
}
