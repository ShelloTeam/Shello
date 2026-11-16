import 'dart:convert';

import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/domain/formalidade.dart';
import '../../../core/storage/chaves_armazenamento.dart';
import '../../../core/storage/key_value_store.dart';
import '../../onboarding/domain/dados_onboarding.dart';
import '../domain/preferencias_usuario.dart';

/// Persistência das preferências do usuário (formalidade, nome, tema e onboarding).
class PreferenciasRepository {
  PreferenciasRepository({required KeyValueStore store}) : _store = store;

  final KeyValueStore _store;

  PreferenciasUsuario ler() {
    final bruto = _store.ler(ChavesArmazenamento.preferencias);
    if (bruto == null || bruto.isEmpty) return const PreferenciasUsuario();
    return PreferenciasUsuario.fromJson(
      jsonDecode(bruto) as Map<String, dynamic>,
    );
  }

  Future<void> definirFormalidade(Formalidade formalidade) =>
      _salvar(ler().copyWith(formalidade: formalidade));

  Future<void> definirTema(TemaApp tema) => _salvar(ler().copyWith(tema: tema));

  Future<void> definirNomeReferencia(String nome) {
    final limpo = nome.trim();
    if (limpo.length > PreferenciasUsuario.limiteNomeReferencia) {
      throw const ErroRegraNegocio('O nome deve ter no máximo 30 caracteres.');
    }
    return _salvar(ler().copyWith(nomeReferencia: limpo));
  }

  /// Grava as respostas do onboarding (com padrões) e marca a etapa como concluída.
  Future<void> concluirOnboarding(DadosOnboarding dados) {
    final completos = dados.comPadroes();
    return _salvar(
      ler().copyWith(
        nomeReferencia: completos.nome,
        onboarding: completos,
        onboardingConcluido: true,
      ),
    );
  }

  Future<void> _salvar(PreferenciasUsuario preferencias) => _store.gravar(
    ChavesArmazenamento.preferencias,
    jsonEncode(preferencias.toJson()),
  );
}
