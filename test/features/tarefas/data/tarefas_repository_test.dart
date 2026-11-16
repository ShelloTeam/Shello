import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/tarefas/data/tarefas_repository.dart';
import 'package:shello/features/tarefas/domain/rotina.dart';
import 'package:shello/features/tarefas/domain/tarefa.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 14);
  late MemoriaKeyValueStore store;
  late TarefasRepository tarefas;
  late RotinasRepository rotinas;

  setUp(() {
    store = MemoriaKeyValueStore();
    tarefas = TarefasRepository(store: store, relogio: () => agora);
    rotinas = RotinasRepository(store: store);
  });

  group('tarefas', () {
    test('adicionar cria tarefa pendente e persiste', () async {
      await tarefas.adicionar(titulo: 'Comprar pão', data: '2026-06-12');
      final nova = TarefasRepository(
        store: store,
        relogio: () => agora,
      ).listar().single;
      expect(nova.titulo, 'Comprar pão');
      expect(nova.concluida, isFalse);
      expect(nova.data, '2026-06-12');
    });

    test('título vazio é recusado', () async {
      expect(
        () => tarefas.adicionar(titulo: '  '),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test('data passada não é aceita em tarefa nova', () async {
      expect(
        () => tarefas.adicionar(titulo: 'Antiga', data: '2026-06-01'),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test(
      'alternar conclusão registra o momento da conclusão e a desfaz',
      () async {
        final t = await tarefas.adicionar(titulo: 'Ler');
        await tarefas.alternar(t.id);
        var atual = tarefas.listar().single;
        expect(atual.concluida, isTrue);
        expect(atual.concluidaEm, agora);

        await tarefas.alternar(t.id);
        atual = tarefas.listar().single;
        expect(atual.concluida, isFalse);
        expect(atual.concluidaEm, isNull);
      },
    );

    test('editar altera título, descrição e data', () async {
      final t = await tarefas.adicionar(titulo: 'Rascunho');
      await tarefas.editar(
        t.id,
        titulo: 'Versão final',
        descricao: 'Detalhe',
        data: '2026-06-20',
      );
      final editada = tarefas.listar().single;
      expect(editada.titulo, 'Versão final');
      expect(editada.descricao, 'Detalhe');
      expect(editada.data, '2026-06-20');
    });

    test('excluir remove a tarefa', () async {
      final t = await tarefas.adicionar(titulo: 'Apagar');
      await tarefas.excluir(t.id);
      expect(tarefas.listar(), isEmpty);
    });

    test('tarefas do chat são gravadas sem data e com origem chat', () async {
      final criadas = await tarefas.adicionarDoChat(['Revisar relatório']);
      expect(criadas.single.data, isNull);
      expect(tarefas.listar().single.origem, OrigemTarefa.chat);
    });

    test(
      'confirmação do chat com mais de 3 tarefas é recusada sem gravar nada',
      () async {
        await expectLater(
          tarefas.adicionarDoChat(['A', 'B', 'C', 'D']),
          throwsA(isA<ErroRegraNegocio>()),
        );
        expect(tarefas.listar(), isEmpty);
      },
    );
  });

  group('rotinas', () {
    test('adicionar rotina exige título e ao menos uma atividade', () async {
      expect(
        () => rotinas.adicionar(
          titulo: '',
          atividades: ['Beber água'],
          periodo: PeriodoRotina.manha,
        ),
        throwsA(isA<ErroRegraNegocio>()),
      );
      expect(
        () => rotinas.adicionar(
          titulo: 'Matinal',
          atividades: const [],
          periodo: PeriodoRotina.manha,
        ),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test('rotina criada é persistida com seu período', () async {
      await rotinas.adicionar(
        titulo: 'Noturna',
        atividades: ['Ler 5 páginas', 'Desligar telas'],
        periodo: PeriodoRotina.noite,
      );
      final r = RotinasRepository(store: store).listar().single;
      expect(r.periodo, PeriodoRotina.noite);
      expect(r.atividades, ['Ler 5 páginas', 'Desligar telas']);
    });

    test('editar e excluir rotina', () async {
      final r = await rotinas.adicionar(
        titulo: 'Tarde',
        atividades: ['Caminhar'],
        periodo: PeriodoRotina.tarde,
      );
      await rotinas.editar(
        r.id,
        titulo: 'Tarde ativa',
        atividades: ['Caminhar', 'Alongar'],
      );
      expect(rotinas.listar().single.titulo, 'Tarde ativa');
      await rotinas.excluir(r.id);
      expect(rotinas.listar(), isEmpty);
    });
  });
}
