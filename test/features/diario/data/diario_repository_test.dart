import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/diario/data/diario_repository.dart';
import 'package:shello/features/perfil/data/memorias_repository.dart';
import 'package:shello/features/perfil/domain/memoria.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 12);

  late MemoriaKeyValueStore store;
  late MemoriasRepository memorias;
  late DiarioRepository diario;

  DiarioRepository novoDiario() =>
      DiarioRepository(store: store, memorias: memorias, relogio: () => agora);

  setUp(() {
    store = MemoriaKeyValueStore();
    memorias = MemoriasRepository(store: store, relogio: () => agora);
    diario = novoDiario();
  });

  test(
    'criar persiste a entrada e listar devolve a mais recente primeiro',
    () async {
      await diario.criar('Primeira reflexão');
      await Future<void>.delayed(Duration.zero);
      final segunda = DiarioRepository(
        store: store,
        memorias: memorias,
        relogio: () => agora.add(const Duration(hours: 1)),
      );
      await segunda.criar('Segunda reflexão');

      final lista = novoDiario().listar();
      expect(lista.map((e) => e.conteudo), [
        'Segunda reflexão',
        'Primeira reflexão',
      ]);
    },
  );

  test('dados sobrevivem a um novo repositório sobre o mesmo armazenamento (reabertura)', () async {
    await diario.criar('Texto que deve sobreviver');
    expect(novoDiario().listar().single.conteudo, 'Texto que deve sobreviver');
  });

  test('criar recusa conteúdo vazio com erro de regra de negócio', () async {
    expect(() => diario.criar('   '), throwsA(isA<ErroRegraNegocio>()));
  });

  test('atualizar altera o conteúdo e preserva a data de criação', () async {
    final entrada = await diario.criar('Rascunho');
    await diario.atualizar(entrada.id, 'Texto final');
    final atualizada = diario.listar().single;
    expect(atualizada.conteudo, 'Texto final');
    expect(atualizada.dataCriacao, entrada.dataCriacao);
  });

  test('excluir remove a entrada da lista persistida', () async {
    final entrada = await diario.criar('Apagar');
    await diario.excluir(entrada.id);
    expect(novoDiario().listar(), isEmpty);
  });

  group('contexto do Shello', () {
    test('marcar como contexto cria memória vinculada à entrada', () async {
      final entrada = await diario.criar('Quero aprender francês este ano');
      await diario.marcarComoContexto(entrada.id);

      final memoria = memorias.listar().single;
      expect(memoria.origemEntradaId, entrada.id);
      expect(memoria.conteudo, startsWith('Reflexão do diário: '));
      expect(memoria.tipo, TipoMemoria.objetivo);
      expect(diario.estaNoContexto(entrada.id), isTrue);
    });

    test(
      'estado de contexto é derivado: remover a memória desmarca a entrada',
      () async {
        final entrada = await diario.criar('Trabalho em casa às terças');
        await diario.marcarComoContexto(entrada.id);
        await memorias.remover(memorias.listar().single.id);
        expect(diario.estaNoContexto(entrada.id), isFalse);
      },
    );

    test('editar entrada no contexto atualiza a memória vinculada', () async {
      final entrada = await diario.criar('Primeiro rascunho da reflexão');
      await diario.marcarComoContexto(entrada.id);
      await diario.atualizar(entrada.id, 'Versão revisada da reflexão');

      final memoria = memorias.listar().single;
      expect(
        memoria.conteudo,
        'Reflexão do diário: Versão revisada da reflexão',
      );
    });

    test('excluir entrada remove também a memória vinculada', () async {
      final entrada = await diario.criar('Memória que deve sumir junto');
      await diario.marcarComoContexto(entrada.id);
      await diario.excluir(entrada.id);
      expect(memorias.listar(), isEmpty);
    });
  });
}
