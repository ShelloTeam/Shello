import '../../../core/utils/datas.dart';

/// Quantidade de dias seguidos com pelo menos uma entrada.
///
/// A sequência começa hoje se já há entrada; caso contrário começa ontem,
/// pois o dia ainda está em aberto. Uma entrada antiga sem continuidade zera.
int calcularSequenciaDias(List<DateTime> datasDeEntrada, DateTime agora) {
  final dias = datasDeEntrada.map(inicioDoDia).toSet();
  final hoje = inicioDoDia(agora);

  var cursor = dias.contains(hoje) ? hoje : diaAnterior(hoje);
  var sequencia = 0;
  while (dias.contains(cursor)) {
    sequencia++;
    cursor = diaAnterior(cursor);
  }
  return sequencia;
}

/// Marca, da posição 0 (seis dias atrás) à 6 (hoje), os dias com entrada.
/// Alimenta a faixa de constância da Home.
List<bool> diasDaSemanaComEntrada(
  List<DateTime> datasDeEntrada,
  DateTime agora,
) {
  final dias = datasDeEntrada.map(inicioDoDia).toSet();
  final hoje = inicioDoDia(agora);
  return [
    for (var atras = 6; atras >= 0; atras--)
      dias.contains(DateTime(hoje.year, hoje.month, hoje.day - atras)),
  ];
}

/// Saudação exibida na Home conforme o horário local.
String saudacaoPorHorario(DateTime agora) {
  final hora = agora.hour;
  if (hora >= 5 && hora < 12) return 'Bom dia,';
  if (hora >= 12 && hora < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

/// Quantas tarefas foram concluídas no mesmo dia de [agora].
int contarConcluidasNoDia(List<DateTime> datasDeConclusao, DateTime agora) {
  return datasDeConclusao.where((data) => mesmoDia(data, agora)).length;
}
