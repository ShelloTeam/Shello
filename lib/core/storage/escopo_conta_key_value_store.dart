import 'dart:convert';

import 'chaves_armazenamento.dart';
import 'key_value_store.dart';

/// Isola os dados de cada conta dentro de um [KeyValueStore] compartilhado.
///
/// Chaves de conta (diário, tarefas, preferências...) são gravadas como
/// `conta.<id>.<chave>`, onde `<id>` é a conta da sessão atual. Chaves globais
/// (versão do esquema, contas cadastradas e sessão) passam direto.
///
/// Com [contaId], o escopo fica fixo naquela conta e ignora a sessão. Isso serve
/// para semear a demonstração sem depender de quem está logado.
///
/// Os repositórios não sabem da existência do escopo: recebem um `KeyValueStore`
/// comum, o que mantém a regra de negócio livre de detalhes de armazenamento.
class EscopoContaKeyValueStore implements KeyValueStore {
  EscopoContaKeyValueStore(this._base, {String? contaId})
    : _contaFixa = contaId;

  final KeyValueStore _base;
  final String? _contaFixa;

  static const Set<String> _chavesGlobais = {
    ChavesArmazenamento.versaoEsquema,
    ChavesArmazenamento.contas,
    ChavesArmazenamento.sessao,
  };

  @override
  String? ler(String chave) {
    if (_ehGlobal(chave)) return _base.ler(chave);
    final conta = _contaAtual();
    if (conta == null) return null;
    return _base.ler(_chaveDaConta(conta, chave));
  }

  @override
  Future<void> gravar(String chave, String valor) {
    if (_ehGlobal(chave)) return _base.gravar(chave, valor);
    return _base.gravar(_chaveDaConta(_exigirConta(), chave), valor);
  }

  @override
  Future<void> remover(String chave) {
    if (_ehGlobal(chave)) return _base.remover(chave);
    return _base.remover(_chaveDaConta(_exigirConta(), chave));
  }

  bool _ehGlobal(String chave) => _chavesGlobais.contains(chave);

  static String _chaveDaConta(String conta, String chave) =>
      'conta.$conta.$chave';

  String _exigirConta() {
    final conta = _contaAtual();
    if (conta == null) {
      throw StateError(
        'Nenhuma conta autenticada: dados de conta não podem ser alterados.',
      );
    }
    return conta;
  }

  /// Id da conta de referência. Sessão ausente ou corrompida significa "sem conta".
  String? _contaAtual() {
    if (_contaFixa != null) return _contaFixa;
    final bruto = _base.ler(ChavesArmazenamento.sessao);
    if (bruto == null) return null;
    try {
      final dados = jsonDecode(bruto);
      if (dados is! Map<String, dynamic>) return null;
      final id = dados['id'];
      return id is String && id.isNotEmpty ? id : null;
    } on FormatException {
      return null;
    }
  }
}
