import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/mocks/dados_demonstracao.dart';
import 'package:shello/features/chat/domain/conversa.dart';
import 'package:shello/features/inicio/domain/estatisticas.dart';
import 'package:shello/features/tarefas/domain/regras_tarefas.dart';
import 'package:shello/features/tarefas/domain/tarefa.dart';
import 'package:shello/features/tarefas/domain/rotina.dart';
import 'package:shello/features/perfil/domain/memoria.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 15);
  final dados = DadosDemonstracao.criar(agora);

  test('diário tem entradas em dias variados, com sequência atual de pelo menos 3 dias', () {
    final dias = dados.entradas.map((e) => e.dataCriacao).toList();
    expect(dados.entradas.length, greaterThanOrEqualTo(6));
    expect(calcularSequenciaDias(dias, agora), greaterThanOrEqualTo(3));
    final diasDistintos = dias
        .map((d) => '${d.year}-${d.month}-${d.day}')
        .toSet();
    expect(diasDistintos.length, greaterThanOrEqualTo(5));
  });

  test('tarefas cobrem atrasada, de hoje, futura, sem data e concluída', () {
    final grupos = agruparTarefas(dados.tarefas, agora);
    expect(grupos.atrasadas, isNotEmpty);
    expect(grupos.hoje, isNotEmpty);
    expect(grupos.proximas, isNotEmpty);
    expect(grupos.semData, isNotEmpty);
    expect(grupos.concluidas, isNotEmpty);
  });

  test('rotinas existem para manhã, tarde e noite', () {
    final periodos = dados.rotinas.map((r) => r.periodo).toSet();
    expect(periodos, containsAll(PeriodoRotina.values));
  });

  test('memórias de contexto cobrem pelo menos quatro categorias', () {
    final tipos = dados.memorias.map((m) => m.tipo).toSet();
    expect(tipos.length, greaterThanOrEqualTo(4));
  });

  test('há uma conversa arquivada com mensagens para o histórico', () {
    final arquivadas = dados.conversas.where(
      (c) => c.status == StatusConversa.arquivada,
    );
    expect(arquivadas, isNotEmpty);
    expect(arquivadas.first.mensagens.length, greaterThanOrEqualTo(2));
  });

  test('preferências e conta de demonstração são coerentes entre si', () {
    expect(dados.preferencias.nomeReferencia, 'Ana');
    expect(dados.preferencias.onboardingConcluido, isTrue);
    expect(dados.conta.email, 'demo@exemplo.com');
    expect(dados.conta.senha, 'Demo@1234');
  });

  test('identificadores são únicos dentro de cada coleção', () {
    expect(
      dados.entradas.map((e) => e.id).toSet().length,
      dados.entradas.length,
    );
    expect(dados.tarefas.map((t) => t.id).toSet().length, dados.tarefas.length);
    expect(
      dados.memorias.map((m) => m.id).toSet().length,
      dados.memorias.length,
    );
  });

  test('uma memória ligada a uma entrada referencia uma entrada existente', () {
    final idsEntradas = dados.entradas.map((e) => e.id).toSet();
    for (final memoria in dados.memorias.where(
      (m) => m.origemEntradaId != null,
    )) {
      expect(idsEntradas, contains(memoria.origemEntradaId));
      expect(memoria.conteudo, startsWith(Memoria.prefixoReflexao));
    }
  });

  test('a seed é determinística para o mesmo instante', () {
    final outra = DadosDemonstracao.criar(agora);
    expect(
      outra.tarefas.map((t) => t.titulo),
      dados.tarefas.map((t) => t.titulo),
    );
    expect(outra.entradas.map((e) => e.id), dados.entradas.map((e) => e.id));
  });

  test('tarefas da seed não contêm datas passadas em tarefas pendentes sem vínculo', () {
    final concluidas = dados.tarefas.where((t) => t.concluida);
    expect(concluidas.every((t) => t.concluidaEm != null), isTrue);
    expect(
      dados.tarefas
          .where((t) => t.origem == OrigemTarefa.chat)
          .every((t) => t.data == null),
      isTrue,
    );
  });
}
