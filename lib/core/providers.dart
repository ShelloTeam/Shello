import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/autenticacao/data/autenticacao_repository.dart';
import '../features/chat/data/chat_repository.dart';
import '../features/diario/data/diario_repository.dart';
import '../features/perfil/data/memorias_repository.dart';
import '../features/preferencias/data/preferencias_repository.dart';
import '../features/tarefas/data/tarefas_repository.dart';
import 'storage/escopo_conta_key_value_store.dart';
import 'storage/key_value_store.dart';
import 'utils/relogio.dart';

/// Armazenamento físico, com os dados de todas as contas. Substituído na
/// inicialização e nos testes. Só a autenticação e a demonstração usam direto.
final keyValueStoreProvider = Provider<KeyValueStore>(
  (ref) =>
      throw UnimplementedError('keyValueStoreProvider deve ser sobrescrito.'),
);

/// Armazenamento visto pelos repositórios de dados de conta. Enxerga apenas os
/// dados da conta em sessão. Derivado de [keyValueStoreProvider], por isso não
/// precisa ser sobrescrito.
final armazenamentoDaContaProvider = Provider<KeyValueStore>(
  (ref) => EscopoContaKeyValueStore(ref.watch(keyValueStoreProvider)),
);

/// Fonte de "agora". Sobrescrita nos testes para datas estáveis.
final relogioProvider = Provider<Relogio>(
  (ref) =>
      () => DateTime.now(),
);

/// Atraso simulado da resposta do Shello. Zero nos testes.
final atrasoDigitacaoProvider = Provider<Duration>(
  (ref) => const Duration(milliseconds: 900),
);

final autenticacaoRepositoryProvider = Provider<AutenticacaoRepository>(
  (ref) => AutenticacaoRepository(
    store: ref.watch(keyValueStoreProvider),
    relogio: ref.watch(relogioProvider),
  ),
);

final preferenciasRepositoryProvider = Provider<PreferenciasRepository>(
  (ref) =>
      PreferenciasRepository(store: ref.watch(armazenamentoDaContaProvider)),
);

final memoriasRepositoryProvider = Provider<MemoriasRepository>(
  (ref) => MemoriasRepository(
    store: ref.watch(armazenamentoDaContaProvider),
    relogio: ref.watch(relogioProvider),
  ),
);

final diarioRepositoryProvider = Provider<DiarioRepository>(
  (ref) => DiarioRepository(
    store: ref.watch(armazenamentoDaContaProvider),
    memorias: ref.watch(memoriasRepositoryProvider),
    relogio: ref.watch(relogioProvider),
  ),
);

final tarefasRepositoryProvider = Provider<TarefasRepository>(
  (ref) => TarefasRepository(
    store: ref.watch(armazenamentoDaContaProvider),
    relogio: ref.watch(relogioProvider),
  ),
);

final rotinasRepositoryProvider = Provider<RotinasRepository>(
  (ref) => RotinasRepository(store: ref.watch(armazenamentoDaContaProvider)),
);

final chatRepositoryProvider = Provider<ChatRepository>(
  (ref) => ChatRepository(
    store: ref.watch(armazenamentoDaContaProvider),
    relogio: ref.watch(relogioProvider),
  ),
);
