import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/features/tarefas/domain/regras_tarefas.dart';
import 'package:shello/features/tarefas/domain/tarefa.dart';

Tarefa tarefa({
  required String id,
  String titulo = 'Tarefa',
  String? data,
  bool concluida = false,
}) => Tarefa(
  id: id,
  titulo: titulo,
  data: data,
  concluida: concluida,
  dataCriacao: DateTime(2026, 6, 1),
  concluidaEm: concluida ? DateTime(2026, 6, 10, 8) : null,
);

void main() {
  final hoje = DateTime(2026, 6, 10, 14);

  group('estaAtrasada', () {
    test('tarefa com data anterior a hoje e não concluída está atrasada', () {
      expect(estaAtrasada(tarefa(id: '1', data: '2026-06-09'), hoje), isTrue);
    });

    test('tarefa concluída nunca fica atrasada', () {
      expect(
        estaAtrasada(
          tarefa(id: '1', data: '2026-06-09', concluida: true),
          hoje,
        ),
        isFalse,
      );
    });

    test('tarefa sem data não está atrasada', () {
      expect(estaAtrasada(tarefa(id: '1'), hoje), isFalse);
    });

    test('tarefa de hoje não está atrasada', () {
      expect(estaAtrasada(tarefa(id: '1', data: '2026-06-10'), hoje), isFalse);
    });
  });

  group('agruparTarefas', () {
    test(
      'separa atrasadas, hoje, próximas por data, sem data e concluídas',
      () {
        final tarefas = [
          tarefa(id: 'a', data: '2026-06-08'),
          tarefa(id: 'b', data: '2026-06-10'),
          tarefa(id: 'c', data: '2026-06-12'),
          tarefa(id: 'd'),
          tarefa(id: 'e', data: '2026-06-10', concluida: true),
        ];

        final grupos = agruparTarefas(tarefas, hoje);

        expect(grupos.atrasadas.map((t) => t.id), ['a']);
        expect(grupos.hoje.map((t) => t.id), ['b']);
        expect(grupos.proximas.keys.toList(), ['2026-06-12']);
        expect(grupos.proximas['2026-06-12']!.map((t) => t.id), ['c']);
        expect(grupos.semData.map((t) => t.id), ['d']);
        expect(grupos.concluidas.map((t) => t.id), ['e']);
      },
    );
  });

  group('filtrarTarefas', () {
    final tarefas = [
      tarefa(id: 'a', titulo: 'Comprar pão'),
      tarefa(id: 'b', titulo: 'Revisar relatório', concluida: true),
      tarefa(id: 'c', titulo: 'Pagar conta', data: '2026-06-09'),
    ];

    test('filtro concluídas mostra só as concluídas', () {
      final r = filtrarTarefas(tarefas, FiltroTarefas.concluidas, '', hoje);
      expect(r.map((t) => t.id), ['b']);
    });

    test('filtro atrasadas mostra só as atrasadas', () {
      final r = filtrarTarefas(tarefas, FiltroTarefas.atrasadas, '', hoje);
      expect(r.map((t) => t.id), ['c']);
    });

    test('busca ignora maiúsculas e acentos no título', () {
      final r = filtrarTarefas(tarefas, FiltroTarefas.todas, 'REVISAR', hoje);
      expect(r.map((t) => t.id), ['b']);
    });
  });

  group('criarTarefasDoChat (regra D06 e limite de 3)', () {
    test('tarefas criadas pelo chat nunca recebem data', () {
      final novas = criarTarefasDoChat(
        ['Comprar pão'],
        hoje,
        novoId: (i) => 'id$i',
      );
      expect(novas.single.data, isNull);
      expect(novas.single.titulo, 'Comprar pão');
      expect(novas.single.origem, OrigemTarefa.chat);
    });

    test('aceita até 3 tarefas por chamada', () {
      final novas = criarTarefasDoChat(
        ['A', 'B', 'C'],
        hoje,
        novoId: (i) => 'id$i',
      );
      expect(novas.length, 3);
    });

    test('mais de 3 tarefas por chamada é recusado', () {
      expect(
        () => criarTarefasDoChat(
          ['A', 'B', 'C', 'D'],
          hoje,
          novoId: (i) => 'id$i',
        ),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });

    test('título vazio é recusado', () {
      expect(
        () => criarTarefasDoChat(['  '], hoje, novoId: (i) => 'id$i'),
        throwsA(isA<ErroRegraNegocio>()),
      );
    });
  });

  group('validarDataNovaTarefa', () {
    test('data passada não pode ser usada em tarefa nova', () {
      expect(validarDataNovaTarefa(DateTime(2026, 6, 9), hoje), isNotNull);
    });

    test('hoje e datas futuras são aceitas', () {
      expect(validarDataNovaTarefa(DateTime(2026, 6, 10), hoje), isNull);
      expect(validarDataNovaTarefa(DateTime(2026, 7, 1), hoje), isNull);
    });
  });

  group('progressoTarefas', () {
    test('conta concluídas e total e calcula a fração concluída', () {
      final tarefas = [
        Tarefa(
          id: 'a',
          titulo: 'A',
          concluida: true,
          dataCriacao: DateTime(2026, 6, 1),
        ),
        Tarefa(
          id: 'b',
          titulo: 'B',
          concluida: true,
          dataCriacao: DateTime(2026, 6, 1),
        ),
        Tarefa(
          id: 'c',
          titulo: 'C',
          concluida: false,
          dataCriacao: DateTime(2026, 6, 1),
        ),
        Tarefa(
          id: 'd',
          titulo: 'D',
          concluida: false,
          dataCriacao: DateTime(2026, 6, 1),
        ),
      ];
      final progresso = progressoTarefas(tarefas);
      expect(progresso.concluidas, 2);
      expect(progresso.total, 4);
      expect(progresso.fracao, 0.5);
    });

    test('sem tarefas a fração é zero, sem divisão por zero', () {
      final progresso = progressoTarefas(const []);
      expect(progresso.total, 0);
      expect(progresso.fracao, 0);
    });
  });
}
