import 'dart:convert';

import 'package:crypto/crypto.dart';

import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/storage/chaves_armazenamento.dart';
import '../../../core/storage/key_value_store.dart';
import '../../../core/utils/identificador.dart';
import '../../../core/utils/relogio.dart';
import '../domain/credenciais_demonstracao.dart';
import '../domain/sessao_usuario.dart';

/// Autenticação simulada com contas locais. A senha é guardada apenas como
/// hash salgado (SHA-256) — suficiente para uma demonstração offline, não para
/// produção: não há servidor, nenhum e-mail é enviado.
class AutenticacaoRepository {
  AutenticacaoRepository({
    required KeyValueStore store,
    required Relogio relogio,
  }) : _store = store,
       _relogio = relogio;

  final KeyValueStore _store;
  final Relogio _relogio;

  SessaoUsuario? sessaoAtual() {
    final bruto = _store.ler(ChavesArmazenamento.sessao);
    if (bruto == null || bruto.isEmpty) return null;
    return SessaoUsuario.fromJson(jsonDecode(bruto) as Map<String, dynamic>);
  }

  int quantidadeDeContas() => _lerContas().length;

  Future<SessaoUsuario> registrar({
    required String nome,
    required String email,
    required String senha,
  }) async {
    final conta = await _criarConta(
      id: gerarId(),
      nome: nome,
      email: email,
      senha: senha,
    );
    return _iniciarSessao(conta);
  }

  Future<SessaoUsuario> entrar({
    required String email,
    required String senha,
  }) async {
    final emailNormalizado = _normalizarEmail(email);
    final conta = _buscarConta(emailNormalizado);
    final credenciaisValidas =
        conta != null && conta['hash'] == _hash(conta['salt'] as String, senha);
    if (conta == null || !credenciaisValidas) {
      throw const ErroRegraNegocio('E-mail ou senha incorretos.');
    }
    return _iniciarSessao(conta);
  }

  Future<void> sair() => _store.remover(ChavesArmazenamento.sessao);

  /// Garante a conta de demonstração e devolve o id dela, que identifica os
  /// dados de exemplo. Não abre sessão: quem chama decide se o usuário entra.
  Future<String> garantirContaDemonstracao() async {
    const demo = CredenciaisDemonstracao.padrao;
    final existente = _buscarConta(_normalizarEmail(demo.email));
    if (existente != null) return existente['id'] as String;
    final conta = await _criarConta(
      id: gerarId(),
      nome: demo.nome,
      email: demo.email,
      senha: demo.senha,
    );
    return conta['id'] as String;
  }

  Future<Map<String, dynamic>> _criarConta({
    required String id,
    required String nome,
    required String email,
    required String senha,
  }) async {
    final emailNormalizado = _normalizarEmail(email);
    if (_buscarConta(emailNormalizado) != null) {
      throw const ErroRegraNegocio('Já existe uma conta com este e-mail.');
    }
    final salt = gerarId();
    final conta = <String, dynamic>{
      'id': id,
      'nome': nome.trim(),
      'email': emailNormalizado,
      'salt': salt,
      'hash': _hash(salt, senha),
      'criadaEm': _relogio().toIso8601String(),
    };
    await _store.gravar(
      ChavesArmazenamento.contas,
      jsonEncode([..._lerContas(), conta]),
    );
    return conta;
  }

  Future<SessaoUsuario> _iniciarSessao(Map<String, dynamic> conta) async {
    final sessao = SessaoUsuario(
      id: conta['id'] as String,
      nome: conta['nome'] as String,
      email: conta['email'] as String,
    );
    await _store.gravar(
      ChavesArmazenamento.sessao,
      jsonEncode(sessao.toJson()),
    );
    return sessao;
  }

  Map<String, dynamic>? _buscarConta(String email) {
    for (final conta in _lerContas()) {
      if (conta['email'] == email) return conta;
    }
    return null;
  }

  List<Map<String, dynamic>> _lerContas() {
    final bruto = _store.ler(ChavesArmazenamento.contas);
    if (bruto == null || bruto.isEmpty) return <Map<String, dynamic>>[];
    return (jsonDecode(bruto) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  static String _normalizarEmail(String email) => email.trim().toLowerCase();

  static String _hash(String salt, String senha) =>
      sha256.convert(utf8.encode('$salt:$senha')).toString();
}
