/// Violação de uma regra de negócio (ex.: conteúdo vazio, limite excedido).
///
/// A mensagem é legível para o usuário e pode ser exibida diretamente na UI.
class ErroRegraNegocio implements Exception {
  const ErroRegraNegocio(this.mensagem);

  final String mensagem;

  @override
  String toString() => mensagem;
}
