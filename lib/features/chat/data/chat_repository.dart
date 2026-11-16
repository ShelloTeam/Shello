import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/storage/chaves_armazenamento.dart';
import '../../../core/storage/colecao_json.dart';
import '../../../core/storage/key_value_store.dart';
import '../../../core/utils/identificador.dart';
import '../../../core/utils/relogio.dart';
import '../domain/conversa.dart';
import '../domain/mensagem_chat.dart';
import '../domain/motor_respostas.dart';

/// Persistência das conversas do chat e aplicação das regras de arquivamento
/// (inatividade > 2h) e de limite (20 mensagens por conversa ativa).
class ChatRepository {
  ChatRepository({
    required KeyValueStore store,
    required Relogio relogio,
    String chave = ChavesArmazenamento.conversas,
  }) : _relogio = relogio,
       _colecao = ColecaoJson<Conversa>(
         store: store,
         chave: chave,
         deJson: Conversa.fromJson,
         paraJson: (c) => c.toJson(),
       );

  final Relogio _relogio;
  final ColecaoJson<Conversa> _colecao;

  /// Conversa ativa, após arquivar as que estão inativas há mais de 2 horas.
  Conversa? conversaAtiva() {
    final agora = _relogio();
    var conversas = _colecao.listar();
    final arquivadas = conversas.map((c) {
      if (c.status == StatusConversa.ativa &&
          _deveArquivarPorInatividade(c.ultimaAtividade, agora)) {
        return c.copyWith(status: StatusConversa.arquivada);
      }
      return c;
    }).toList();
    if (arquivadas.indexed.any(
      (par) => par.$2.status != conversas[par.$1].status,
    )) {
      conversas = arquivadas;
      _colecao.salvar(conversas);
    }
    for (final conversa in conversas) {
      if (conversa.status == StatusConversa.ativa) return conversa;
    }
    return null;
  }

  /// Conversas arquivadas, da mais recente para a mais antiga.
  List<Conversa> historico() {
    final itens =
        _colecao
            .listar()
            .where((c) => c.status == StatusConversa.arquivada)
            .toList()
          ..sort((a, b) => b.ultimaAtividade.compareTo(a.ultimaAtividade));
    return itens;
  }

  /// Retorna a conversa ativa, criando uma nova com a saudação inicial se necessário.
  Future<Conversa> garantirConversaAtiva({required String nome}) async {
    final ativa = conversaAtiva();
    if (ativa != null) return ativa;
    final agora = _relogio();
    final nova = Conversa(
      id: gerarId(),
      status: StatusConversa.ativa,
      mensagens: [
        MensagemChat(
          id: gerarId(),
          remetente: RemetenteChat.shello,
          conteudo:
              'Olá, $nome! 🌿 Sou o Shello, seu companheiro de crescimento pessoal. '
              'O que você quer explorar hoje?',
          horario: agora,
          expressao: ExpressaoShello.feliz,
          ehBoasVindas: true,
        ),
      ],
      criadaEm: agora,
      ultimaAtividade: agora,
    );
    await _colecao.salvar([..._colecao.listar(), nova]);
    return nova;
  }

  int contarMensagensPersistidas() => conversaAtiva()?.mensagensContaveis ?? 0;

  Future<void> adicionarMensagens(
    String conversaId,
    List<MensagemChat> novas,
  ) async {
    final conversas = _colecao.listar();
    final indice = conversas.indexWhere((c) => c.id == conversaId);
    if (indice == -1) {
      throw const ErroRegraNegocio('Conversa não encontrada.');
    }
    final alvo = conversas[indice];
    if (alvo.status == StatusConversa.arquivada) {
      throw const ErroRegraNegocio(
        'Esta conversa foi arquivada. Inicie uma nova conversa.',
      );
    }
    final contaveisNovas = novas.where((m) => !m.ehBoasVindas).length;
    if (!RegrasConversa.cabeNoLimite(alvo.mensagensContaveis, contaveisNovas)) {
      throw const ErroRegraNegocio(
        'Limite de 20 mensagens atingido. Inicie uma nova conversa para continuar.',
      );
    }
    final atualizada = alvo.copyWith(
      mensagens: [...alvo.mensagens, ...novas],
      ultimaAtividade: _relogio(),
    );
    conversas[indice] = atualizada;
    await _colecao.salvar(conversas);
  }

  /// "Novo chat": arquiva a conversa ativa, se existir.
  Future<void> arquivarAtiva() async {
    final ativa = conversaAtiva();
    if (ativa == null) return;
    await _colecao.salvar(
      _colecao.listar().map((c) {
        return c.id == ativa.id
            ? c.copyWith(status: StatusConversa.arquivada)
            : c;
      }).toList(),
    );
  }

  Future<void> marcarSugestaoResolvida(String mensagemId) async {
    final conversas = _colecao.listar().map((c) {
      final mensagens = c.mensagens
          .map(
            (m) => m.id == mensagemId ? m.copyWith(sugestaoResolvida: true) : m,
          )
          .toList();
      return c.copyWith(mensagens: mensagens);
    }).toList();
    await _colecao.salvar(conversas);
  }

  static bool _deveArquivarPorInatividade(
    DateTime ultimaAtividade,
    DateTime agora,
  ) => RegrasConversa.deveArquivar(ultimaAtividade, agora);
}
