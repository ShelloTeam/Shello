import '../../../core/storage/colecao_json.dart';
import '../../../core/storage/key_value_store.dart';
import '../../../core/utils/identificador.dart';
import '../../../core/utils/relogio.dart';
import '../../perfil/data/memorias_repository.dart';
import '../../perfil/domain/memoria.dart';
import '../domain/entrada_diario.dart';

/// Persistência das anotações do diário e do vínculo com o contexto do Shello.
class DiarioRepository {
  DiarioRepository({
    required KeyValueStore store,
    required MemoriasRepository memorias,
    required Relogio relogio,
    String chave = 'shello.entradas',
  }) : _memorias = memorias,
       _relogio = relogio,
       _colecao = ColecaoJson<EntradaDiario>(
         store: store,
         chave: chave,
         deJson: EntradaDiario.fromJson,
         paraJson: (e) => e.toJson(),
       );

  final MemoriasRepository _memorias;
  final Relogio _relogio;
  final ColecaoJson<EntradaDiario> _colecao;

  /// Entradas da mais recente para a mais antiga.
  List<EntradaDiario> listar() {
    final itens = _colecao.listar()
      ..sort((a, b) => b.dataCriacao.compareTo(a.dataCriacao));
    return itens;
  }

  Future<EntradaDiario> criar(String conteudo) async {
    final texto = validarConteudoDiario(conteudo);
    final nova = EntradaDiario(
      id: gerarId(),
      conteudo: texto,
      dataCriacao: _relogio(),
    );
    await _colecao.salvar([...listar(), nova]);
    return nova;
  }

  Future<void> atualizar(String id, String conteudo) async {
    final texto = validarConteudoDiario(conteudo);
    final agora = _relogio();
    final atualizadas = _colecao.listar().map((e) {
      if (e.id != id) return e;
      return e.copyWith(conteudo: texto, dataAtualizacao: agora);
    }).toList();
    await _colecao.salvar(atualizadas);

    final memoria = _memorias.porOrigem(id);
    if (memoria != null) {
      await _memorias.atualizar(
        memoria.id,
        conteudo: Memoria.textoReflexao(texto),
        tipo: classificarTipoMemoria(texto),
      );
    }
  }

  /// Remove a entrada e a memória de contexto vinculada a ela.
  Future<void> excluir(String id) async {
    await _memorias.removerDeOrigem(id);
    await _colecao.salvar(_colecao.listar().where((e) => e.id != id).toList());
  }

  /// Cria a memória de contexto a partir da entrada. Idempotente: não duplica.
  Future<void> marcarComoContexto(String id) async {
    if (estaNoContexto(id)) return;
    for (final entrada in _colecao.listar()) {
      if (entrada.id != id) continue;
      await _memorias.adicionar(
        conteudo: Memoria.textoReflexao(entrada.conteudo),
        tipo: classificarTipoMemoria(entrada.conteudo),
        origemEntradaId: id,
      );
      return;
    }
  }

  bool estaNoContexto(String id) => _memorias.porOrigem(id) != null;
}
