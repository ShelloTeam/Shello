import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../domain/sessao_usuario.dart';

/// Sessão local simulada. `null` significa usuário não autenticado.
///
/// Os controllers de dados observam este provider: cada entrada, cadastro ou
/// saída reconstrói o estado a partir do armazenamento da conta em sessão, sem
/// resquício da conta anterior.
final sessaoProvider = NotifierProvider<SessaoController, SessaoUsuario?>(
  SessaoController.new,
);

class SessaoController extends Notifier<SessaoUsuario?> {
  @override
  SessaoUsuario? build() =>
      ref.read(autenticacaoRepositoryProvider).sessaoAtual();

  Future<void> entrar(String email, String senha) async {
    state = await ref
        .read(autenticacaoRepositoryProvider)
        .entrar(email: email, senha: senha);
  }

  /// Cadastro cria a conta e inicia a sessão. A conta nova começa vazia e com
  /// o onboarding pendente.
  Future<void> registrar({
    required String nome,
    required String email,
    required String senha,
  }) async {
    state = await ref
        .read(autenticacaoRepositoryProvider)
        .registrar(nome: nome, email: email, senha: senha);
  }

  Future<void> sair() async {
    await ref.read(autenticacaoRepositoryProvider).sair();
    state = null;
  }
}
