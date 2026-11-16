import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../../perfil/presentation/perfil_providers.dart';
import '../domain/entrada_diario.dart';

final entradasProvider =
    NotifierProvider<EntradasController, List<EntradaDiario>>(
      EntradasController.new,
    );

/// Ids das entradas que já estão no contexto do Shello (derivado das memórias).
final idsNoContextoProvider = Provider<Set<String>>((ref) {
  final memorias = ref.watch(memoriasProvider);
  return {
    for (final memoria in memorias)
      if (memoria.origemEntradaId != null) memoria.origemEntradaId!,
  };
});

class EntradasController extends Notifier<List<EntradaDiario>> {
  @override
  List<EntradaDiario> build() {
    ref.watch(sessaoProvider);
    return ref.read(diarioRepositoryProvider).listar();
  }

  Future<EntradaDiario> adicionar(String conteudo) async {
    final nova = await ref.read(diarioRepositoryProvider).criar(conteudo);
    _recarregar();
    return nova;
  }

  Future<void> atualizar(String id, String conteudo) async {
    await ref.read(diarioRepositoryProvider).atualizar(id, conteudo);
    _recarregar();
    ref.invalidate(memoriasProvider);
  }

  Future<void> excluir(String id) async {
    await ref.read(diarioRepositoryProvider).excluir(id);
    _recarregar();
    ref.invalidate(memoriasProvider);
  }

  Future<void> marcarComoContexto(String id) async {
    await ref.read(diarioRepositoryProvider).marcarComoContexto(id);
    ref.invalidate(memoriasProvider);
  }

  void _recarregar() => state = ref.read(diarioRepositoryProvider).listar();
}
