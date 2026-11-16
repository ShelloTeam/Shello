import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/storage/chaves_armazenamento.dart';
import 'package:shello/core/storage/escopo_conta_key_value_store.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';

void main() {
  late MemoriaKeyValueStore base;

  void entrarComo(String id) {
    base.gravar(
      ChavesArmazenamento.sessao,
      jsonEncode({'id': id, 'nome': 'Teste', 'email': '$id@exemplo.com'}),
    );
  }

  setUp(() {
    base = MemoriaKeyValueStore();
  });

  test('dados de conta são gravados sob o id da conta autenticada', () async {
    entrarComo('conta-a');
    final escopo = EscopoContaKeyValueStore(base);
    await escopo.gravar(ChavesArmazenamento.entradas, '[1]');

    expect(base.ler('conta.conta-a.${ChavesArmazenamento.entradas}'), '[1]');
    expect(escopo.ler(ChavesArmazenamento.entradas), '[1]');
  });

  test(
    'uma conta não enxerga os dados da outra depois de trocar a sessão',
    () async {
      entrarComo('conta-a');
      final escopo = EscopoContaKeyValueStore(base);
      await escopo.gravar(ChavesArmazenamento.tarefas, '[a]');

      entrarComo('conta-b');
      expect(escopo.ler(ChavesArmazenamento.tarefas), isNull);

      entrarComo('conta-a');
      expect(escopo.ler(ChavesArmazenamento.tarefas), '[a]');
    },
  );

  test('chaves globais (contas, sessão e versão) não são escopadas', () async {
    entrarComo('conta-a');
    final escopo = EscopoContaKeyValueStore(base);
    await escopo.gravar(ChavesArmazenamento.versaoEsquema, '1');
    await escopo.gravar(ChavesArmazenamento.contas, '[]');

    expect(base.ler(ChavesArmazenamento.versaoEsquema), '1');
    expect(base.ler(ChavesArmazenamento.contas), '[]');
  });

  test('sem conta autenticada, a leitura de dados de conta é vazia', () {
    final escopo = EscopoContaKeyValueStore(base);
    expect(escopo.ler(ChavesArmazenamento.entradas), isNull);
  });

  test('sem conta autenticada, gravar dados de conta é recusado', () async {
    final escopo = EscopoContaKeyValueStore(base);
    expect(
      () => escopo.gravar(ChavesArmazenamento.entradas, '[]'),
      throwsA(isA<StateError>()),
    );
  });

  test(
    'um escopo fixo ignora a sessão atual (usado para semear a demonstração)',
    () async {
      entrarComo('conta-a');
      final fixo = EscopoContaKeyValueStore(base, contaId: 'demo');
      await fixo.gravar(ChavesArmazenamento.preferencias, '{}');

      expect(base.ler('conta.demo.${ChavesArmazenamento.preferencias}'), '{}');
      expect(
        EscopoContaKeyValueStore(base).ler(ChavesArmazenamento.preferencias),
        isNull,
      );
    },
  );

  test('remover apaga apenas a chave da conta atual', () async {
    entrarComo('conta-a');
    final escopo = EscopoContaKeyValueStore(base);
    await escopo.gravar(ChavesArmazenamento.rotinas, '[r]');
    entrarComo('conta-b');
    await escopo.gravar(ChavesArmazenamento.rotinas, '[b]');

    await escopo.remover(ChavesArmazenamento.rotinas);

    expect(escopo.ler(ChavesArmazenamento.rotinas), isNull);
    entrarComo('conta-a');
    expect(escopo.ler(ChavesArmazenamento.rotinas), '[r]');
  });

  test('sessão corrompida é tratada como ausência de conta', () {
    base.gravar(ChavesArmazenamento.sessao, 'não é json');
    expect(
      EscopoContaKeyValueStore(base).ler(ChavesArmazenamento.entradas),
      isNull,
    );
  });
}
