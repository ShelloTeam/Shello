import 'mocks/restauracao_demonstracao.dart';
import 'storage/chaves_armazenamento.dart';
import 'storage/key_value_store.dart';
import 'utils/relogio.dart';

/// Prepara o armazenamento para a versão atual do formato. Na primeira execução
/// grava a demonstração na conta demo. Execuções seguintes não alteram nada.
///
/// Dados de versões anteriores não tinham dono (eram compartilhados pelo
/// aparelho), por isso são descartados antes de recriar a demonstração.
Future<void> prepararArmazenamento({
  required KeyValueStore store,
  required Relogio relogio,
}) async {
  final versaoAtual = '${ChavesArmazenamento.versaoAtual}';
  if (store.ler(ChavesArmazenamento.versaoEsquema) == versaoAtual) return;
  for (final chave in ChavesArmazenamento.dadosDeConta) {
    await store.remover(chave);
  }
  await restaurarDemonstracao(store: store, relogio: relogio);
}
