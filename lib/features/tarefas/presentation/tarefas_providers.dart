import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../domain/rotina.dart';
import '../domain/tarefa.dart';

final tarefasProvider = NotifierProvider<TarefasController, List<Tarefa>>(
  TarefasController.new,
);

final rotinasProvider = NotifierProvider<RotinasController, List<Rotina>>(
  RotinasController.new,
);

class TarefasController extends Notifier<List<Tarefa>> {
  @override
  List<Tarefa> build() {
    ref.watch(sessaoProvider);
    return ref.read(tarefasRepositoryProvider).listar();
  }

  Future<Tarefa> adicionar({
    String? titulo,
    String? descricao,
    String? data,
  }) async {
    final nova = await ref
        .read(tarefasRepositoryProvider)
        .adicionar(titulo: titulo ?? '', descricao: descricao, data: data);
    _recarregar();
    return nova;
  }

  Future<void> editar(
    String id, {
    String? titulo,
    String? descricao,
    String? data,
    bool limparData = false,
  }) async {
    await ref
        .read(tarefasRepositoryProvider)
        .editar(
          id,
          titulo: titulo,
          descricao: descricao,
          data: data,
          limparData: limparData,
        );
    _recarregar();
  }

  Future<void> alternar(String id) async {
    await ref.read(tarefasRepositoryProvider).alternar(id);
    _recarregar();
  }

  Future<void> excluir(String id) async {
    await ref.read(tarefasRepositoryProvider).excluir(id);
    _recarregar();
  }

  Future<void> adicionarDoChat(List<String> titulos) async {
    await ref.read(tarefasRepositoryProvider).adicionarDoChat(titulos);
    _recarregar();
  }

  void _recarregar() => state = ref.read(tarefasRepositoryProvider).listar();
}

class RotinasController extends Notifier<List<Rotina>> {
  @override
  List<Rotina> build() {
    ref.watch(sessaoProvider);
    return ref.read(rotinasRepositoryProvider).listar();
  }

  Future<void> adicionar({
    required String titulo,
    required List<String> atividades,
    required PeriodoRotina periodo,
  }) async {
    await ref
        .read(rotinasRepositoryProvider)
        .adicionar(titulo: titulo, atividades: atividades, periodo: periodo);
    _recarregar();
  }

  Future<void> editar(
    String id, {
    String? titulo,
    List<String>? atividades,
    PeriodoRotina? periodo,
  }) async {
    await ref
        .read(rotinasRepositoryProvider)
        .editar(id, titulo: titulo, atividades: atividades, periodo: periodo);
    _recarregar();
  }

  Future<void> excluir(String id) async {
    await ref.read(rotinasRepositoryProvider).excluir(id);
    _recarregar();
  }

  void _recarregar() => state = ref.read(rotinasRepositoryProvider).listar();
}
