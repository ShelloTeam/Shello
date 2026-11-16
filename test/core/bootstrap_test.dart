import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/bootstrap.dart';
import 'package:shello/core/storage/chaves_armazenamento.dart';
import 'package:shello/core/storage/escopo_conta_key_value_store.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/autenticacao/data/autenticacao_repository.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 15);

  test('instalação da versão anterior descarta dados soltos e recria a demonstração na conta demo', () async {
    final store = MemoriaKeyValueStore({
      ChavesArmazenamento.versaoEsquema: '1',
      ChavesArmazenamento.entradas: '[{"id":"legado"}]',
      ChavesArmazenamento.tarefas: '[{"id":"legado"}]',
    });

    await prepararArmazenamento(store: store, relogio: () => agora);

    expect(store.ler(ChavesArmazenamento.entradas), isNull);
    expect(store.ler(ChavesArmazenamento.tarefas), isNull);
    expect(
      store.ler(ChavesArmazenamento.versaoEsquema),
      '${ChavesArmazenamento.versaoAtual}',
    );
    await AutenticacaoRepository(
      store: store,
      relogio: () => agora,
    ).entrar(email: 'demo@exemplo.com', senha: 'Demo@1234');
    final entradas = jsonDecode(
      EscopoContaKeyValueStore(store).ler(ChavesArmazenamento.entradas)!,
    ) as List<dynamic>;
    expect(entradas, hasLength(6));
  });

  test(
    'execuções seguintes preservam as alterações feitas pelo usuário',
    () async {
      final store = MemoriaKeyValueStore();
      await prepararArmazenamento(store: store, relogio: () => agora);
      await AutenticacaoRepository(
        store: store,
        relogio: () => agora,
      ).entrar(email: 'demo@exemplo.com', senha: 'Demo@1234');
      final escopo = EscopoContaKeyValueStore(store);
      await escopo.gravar(ChavesArmazenamento.entradas, '[]');

      await prepararArmazenamento(store: store, relogio: () => agora);

      expect(escopo.ler(ChavesArmazenamento.entradas), '[]');
    },
  );
}
