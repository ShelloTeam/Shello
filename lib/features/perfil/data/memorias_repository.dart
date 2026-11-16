import '../../../core/storage/colecao_json.dart';
import '../../../core/storage/key_value_store.dart';
import '../../../core/utils/identificador.dart';
import '../../../core/utils/relogio.dart';
import '../domain/memoria.dart';

/// Persistência local das memórias de contexto do Shello.
class MemoriasRepository {
  MemoriasRepository({
    required KeyValueStore store,
    required Relogio relogio,
    String chave = 'shello.memorias',
  }) : _relogio = relogio,
       _colecao = ColecaoJson<Memoria>(
         store: store,
         chave: chave,
         deJson: Memoria.fromJson,
         paraJson: (m) => m.toJson(),
       );

  final Relogio _relogio;
  final ColecaoJson<Memoria> _colecao;

  /// Memórias da mais recente para a mais antiga.
  List<Memoria> listar() {
    final itens = _colecao.listar()
      ..sort((a, b) => b.dataCriacao.compareTo(a.dataCriacao));
    return itens;
  }

  Memoria? porOrigem(String entradaId) {
    for (final memoria in _colecao.listar()) {
      if (memoria.origemEntradaId == entradaId) return memoria;
    }
    return null;
  }

  Future<Memoria> adicionar({
    required String conteudo,
    required TipoMemoria tipo,
    String? origemEntradaId,
  }) async {
    final nova = Memoria(
      id: gerarId(),
      tipo: tipo,
      conteudo: conteudo.trim(),
      dataCriacao: _relogio(),
      origemEntradaId: origemEntradaId,
    );
    await _colecao.salvar([...listar(), nova]);
    return nova;
  }

  Future<void> atualizar(
    String id, {
    String? conteudo,
    TipoMemoria? tipo,
  }) async {
    final atualizadas = _colecao.listar().map((m) {
      if (m.id != id) return m;
      return m.copyWith(conteudo: conteudo?.trim(), tipo: tipo);
    }).toList();
    await _colecao.salvar(atualizadas);
  }

  Future<void> remover(String id) async {
    await _colecao.salvar(_colecao.listar().where((m) => m.id != id).toList());
  }

  Future<void> removerDeOrigem(String entradaId) async {
    await _colecao.salvar(
      _colecao.listar().where((m) => m.origemEntradaId != entradaId).toList(),
    );
  }
}
