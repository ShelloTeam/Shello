import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../diario/presentation/diario_providers.dart';
import '../../perfil/presentation/perfil_providers.dart';
import '../../tarefas/domain/regras_tarefas.dart';
import '../../tarefas/presentation/tarefas_providers.dart';
import '../domain/estatisticas.dart';

/// Números exibidos na Home. Derivados dos mesmos dados das outras telas.
class EstatisticasInicio {
  const EstatisticasInicio({
    required this.totalEntradas,
    required this.sequenciaDias,
    required this.faixaSemana,
    required this.concluidasHoje,
    required this.pendentesHoje,
    required this.memoriasAtivas,
  });

  final int totalEntradas;
  final int sequenciaDias;

  /// Sete dias até hoje (da posição 0 à 6), marcados quando há entrada.
  final List<bool> faixaSemana;
  final int concluidasHoje;

  /// Tarefas de hoje ainda abertas, incluindo as atrasadas.
  final int pendentesHoje;
  final int memoriasAtivas;
}

final estatisticasInicioProvider = Provider<EstatisticasInicio>((ref) {
  final entradas = ref.watch(entradasProvider);
  final tarefas = ref.watch(tarefasProvider);
  final memorias = ref.watch(memoriasProvider);
  final agora = ref.watch(relogioProvider)();

  final datasEntradas = entradas.map((e) => e.dataCriacao).toList();
  final grupos = agruparTarefas(tarefas, agora);
  final concluidasEm = [
    for (final tarefa in tarefas)
      if (tarefa.concluida && tarefa.concluidaEm != null) tarefa.concluidaEm!,
  ];

  return EstatisticasInicio(
    totalEntradas: entradas.length,
    sequenciaDias: calcularSequenciaDias(datasEntradas, agora),
    faixaSemana: diasDaSemanaComEntrada(datasEntradas, agora),
    concluidasHoje: contarConcluidasNoDia(concluidasEm, agora),
    pendentesHoje: grupos.hoje.length + grupos.atrasadas.length,
    memoriasAtivas: memorias.length,
  );
});
