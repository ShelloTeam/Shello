/// Validações de formulário de autenticação. Mensagens idênticas às da versão
/// React Native para manter a experiência original.
library;

final RegExp _regexEmail = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp _regexSenhaForte = RegExp(
  r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$',
);

const String mensagemSenhaFraca =
    'Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo (@\$!%*?&_-#).';

bool emailValido(String email) => _regexEmail.hasMatch(email.trim());

bool senhaForte(String senha) => _regexSenhaForte.hasMatch(senha);

/// Primeira mensagem de erro do login, ou `null` quando os dados são válidos.
String? validarLogin({required String email, required String senha}) {
  if (email.trim().isEmpty) return 'Preencha o e-mail.';
  if (!emailValido(email)) return 'Digite um e-mail válido.';
  if (senha.isEmpty) return 'Preencha a senha.';
  return null;
}

/// Primeira mensagem de erro do cadastro, ou `null` quando os dados são válidos.
String? validarCadastro({
  required String nome,
  required String email,
  required String senha,
  required String confirmacao,
}) {
  if (nome.trim().isEmpty) return 'Preencha seu nome.';
  if (email.trim().isEmpty) return 'Preencha o e-mail.';
  if (!emailValido(email)) return 'Digite um e-mail válido.';
  if (!senhaForte(senha)) return mensagemSenhaFraca;
  if (senha != confirmacao) return 'As senhas não coincidem.';
  return null;
}

String? validarRecuperacao(String email) {
  return emailValido(email) ? null : 'Digite um e-mail válido.';
}
