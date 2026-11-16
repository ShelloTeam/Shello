import '../../features/autenticacao/data/autenticacao_repository.dart';
import '../storage/escopo_conta_key_value_store.dart';
import '../storage/key_value_store.dart';
import '../utils/relogio.dart';
import 'dados_demonstracao.dart';

/// Regrava os dados de exemplo na conta de demonstração, criando-a se preciso.
/// Não altera a sessão nem os dados das outras contas.
Future<void> restaurarDemonstracao({
  required KeyValueStore store,
  required Relogio relogio,
}) async {
  final idConta = await AutenticacaoRepository(
    store: store,
    relogio: relogio,
  ).garantirContaDemonstracao();
  await DadosDemonstracao.criar(relogio())
      .gravarEm(EscopoContaKeyValueStore(store, contaId: idConta));
}
