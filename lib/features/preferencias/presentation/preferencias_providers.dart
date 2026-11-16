import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/formalidade.dart';
import '../../../core/providers.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../../onboarding/domain/dados_onboarding.dart';
import '../domain/preferencias_usuario.dart';

final preferenciasProvider =
    NotifierProvider<PreferenciasController, PreferenciasUsuario>(
      PreferenciasController.new,
    );

class PreferenciasController extends Notifier<PreferenciasUsuario> {
  @override
  PreferenciasUsuario build() {
    ref.watch(sessaoProvider);
    return ref.read(preferenciasRepositoryProvider).ler();
  }

  Future<void> definirFormalidade(Formalidade formalidade) async {
    await ref
        .read(preferenciasRepositoryProvider)
        .definirFormalidade(formalidade);
    _recarregar();
  }

  Future<void> definirTema(TemaApp tema) async {
    await ref.read(preferenciasRepositoryProvider).definirTema(tema);
    _recarregar();
  }

  Future<void> definirNomeReferencia(String nome) async {
    await ref.read(preferenciasRepositoryProvider).definirNomeReferencia(nome);
    _recarregar();
  }

  Future<void> concluirOnboarding(DadosOnboarding dados) async {
    await ref.read(preferenciasRepositoryProvider).concluirOnboarding(dados);
    _recarregar();
  }

  void _recarregar() => state = ref.read(preferenciasRepositoryProvider).ler();
}
