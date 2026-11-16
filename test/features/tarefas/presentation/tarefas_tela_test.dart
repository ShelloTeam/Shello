import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shello/features/tarefas/presentation/tarefas_providers.dart';

import '../../../helpers/app_de_teste.dart';

void main() {
  setUpAll(prepararLocaleDeTeste);

  Future<void> abrirTarefas(WidgetTester tester) async {
    await tocar(tester, find.byKey(const Key('aba-tarefas')));
  }

  testWidgets('criar tarefa pelo formulário a mostra em Foco de Hoje', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    await tocar(tester, find.byKey(const Key('botao-nova-tarefa')));
    await digitar(tester, const Key('modal-campo-titulo'), 'Comprar pão');
    await tocar(tester, find.byKey(const Key('modal-botao-criar-tarefa')));

    expect(find.text('Comprar pão'), findsOneWidget);
    expect(
      containerDoApp(tester)
          .read(tarefasProvider)
          .any((t) => t.titulo == 'Comprar pão'),
      isTrue,
    );
  });

  testWidgets('concluir tarefa marca como concluída e registra a conclusão', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    await tocar(
      tester,
      find.byKey(const Key('checkbox-Beber dois litros de água no dia')),
    );

    final tarefa = containerDoApp(tester)
        .read(tarefasProvider)
        .singleWhere((t) => t.titulo == 'Beber dois litros de água no dia');
    expect(tarefa.concluida, isTrue);
    expect(tarefa.concluidaEm, isNotNull);
  });

  testWidgets('tarefa com data passada aparece em Atrasadas com o selo', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    expect(find.text('Atrasadas'), findsOneWidget);
    expect(find.text('Atrasada'), findsWidgets);
    expect(find.text('Pagar a conta de luz'), findsOneWidget);
  });

  testWidgets('filtro Concluídas mostra apenas as tarefas concluídas', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    await tocar(tester, find.byKey(const Key('filtro-concluidas')));

    expect(find.text('Organizar a mesa de trabalho'), findsOneWidget);
    expect(find.text('Pagar a conta de luz'), findsNothing);
  });

  testWidgets('editar tarefa altera o título exibido', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    await tocar(tester, find.text('Enviar relatório semanal ao time'));
    await digitar(
      tester,
      const Key('modal-campo-titulo'),
      'Enviar relatório revisado',
    );
    await tocar(tester, find.byKey(const Key('modal-botao-salvar-tarefa')));

    expect(find.text('Enviar relatório revisado'), findsOneWidget);
    expect(find.text('Enviar relatório semanal ao time'), findsNothing);
  });

  testWidgets('criar rotina aparece no período escolhido', (tester) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await abrirTarefas(tester);

    await rolarAte(tester, find.text('Rotinas Diárias'));
    await tocar(tester, find.byKey(const Key('botao-nova-rotina')));
    await digitar(
      tester,
      const Key('modal-campo-rotina-titulo'),
      'Caminhada leve',
    );
    await tocar(tester, find.byKey(const Key('periodo-tarde')));
    await digitar(
      tester,
      const Key('modal-campo-atividades'),
      'Caminhar 15 minutos',
    );
    await tocar(tester, find.byKey(const Key('modal-botao-criar-rotina')));

    expect(find.text('Caminhada leve'), findsOneWidget);
    expect(find.text('Tarde'), findsWidgets);
  });

  testWidgets('o progresso mostra concluídas de total e uma barra', (
    tester,
  ) async {
    final store = await armazenamentoComSessao();
    await subirApp(tester, store: store);
    await tocar(tester, find.byKey(const Key('aba-tarefas')));

    expect(find.text('2 de 8 concluídas'), findsOneWidget);
    expect(find.byKey(const Key('barra-progresso-tarefas')), findsOneWidget);
  });
}
