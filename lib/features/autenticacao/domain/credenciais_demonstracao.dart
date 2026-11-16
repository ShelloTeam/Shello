/// Conta pré-cadastrada para demonstrar o aplicativo sem cadastro.
/// Autenticação é simulada: estas credenciais existem somente neste dispositivo.
class CredenciaisDemonstracao {
  const CredenciaisDemonstracao({
    required this.nome,
    required this.email,
    required this.senha,
  });

  static const CredenciaisDemonstracao padrao = CredenciaisDemonstracao(
    nome: 'Ana',
    email: 'demo@exemplo.com',
    senha: 'Demo@1234',
  );

  final String nome;
  final String email;
  final String senha;
}
