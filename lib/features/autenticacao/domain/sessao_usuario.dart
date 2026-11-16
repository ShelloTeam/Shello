import 'credenciais_demonstracao.dart';

/// Usuário autenticado na sessão local simulada.
class SessaoUsuario {
  const SessaoUsuario({
    required this.id,
    required this.nome,
    required this.email,
  });

  final String id;
  final String nome;
  final String email;

  /// Só a conta de demonstração tem dados de exemplo para restaurar.
  bool get ehDemonstracao => email == CredenciaisDemonstracao.padrao.email;

  Map<String, dynamic> toJson() => {'id': id, 'nome': nome, 'email': email};

  factory SessaoUsuario.fromJson(Map<String, dynamic> json) => SessaoUsuario(
    id: json['id'] as String,
    nome: json['nome'] as String,
    email: json['email'] as String,
  );
}
