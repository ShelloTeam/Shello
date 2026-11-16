import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../domain/memoria.dart';

/// Memórias de contexto do Shello, da mais recente para a mais antiga.
final memoriasProvider = NotifierProvider<MemoriasController, List<Memoria>>(
  MemoriasController.new,
);

class MemoriasController extends Notifier<List<Memoria>> {
  @override
  List<Memoria> build() {
    ref.watch(sessaoProvider);
    return ref.read(memoriasRepositoryProvider).listar();
  }

  Future<void> adicionar({
    required String conteudo,
    required TipoMemoria tipo,
  }) async {
    await ref
        .read(memoriasRepositoryProvider)
        .adicionar(conteudo: conteudo, tipo: tipo);
    _recarregar();
  }

  Future<void> remover(String id) async {
    await ref.read(memoriasRepositoryProvider).remover(id);
    _recarregar();
  }

  void _recarregar() => state = ref.read(memoriasRepositoryProvider).listar();
}
