/// Helpers de data puros. Todas as comparações são feitas no fuso local do
/// dispositivo, por isso o "dia" de uma entrada é sempre o dia local.
library;

/// Meia-noite local do dia de [data].
DateTime inicioDoDia(DateTime data) =>
    DateTime(data.year, data.month, data.day);

/// Dia anterior ao de [data], tratando corretamente a troca de mês e ano.
DateTime diaAnterior(DateTime data) =>
    DateTime(data.year, data.month, data.day - 1);

bool mesmoDia(DateTime a, DateTime b) => inicioDoDia(a) == inicioDoDia(b);

/// Chave estável `yyyy-MM-dd`, usada para agrupar e persistir datas sem hora.
String chaveDia(DateTime data) {
  final mes = data.month.toString().padLeft(2, '0');
  final dia = data.day.toString().padLeft(2, '0');
  return '${data.year.toString().padLeft(4, '0')}-$mes-$dia';
}

/// Converte uma chave `yyyy-MM-dd` em [DateTime] à meia-noite local.
DateTime dataDeChave(String chave) {
  final partes = chave.split('T').first.split('-').map(int.parse).toList();
  return DateTime(partes[0], partes[1], partes[2]);
}
