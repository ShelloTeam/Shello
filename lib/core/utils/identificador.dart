import 'dart:math';

final Random _aleatorio = Random();
int _sequencia = 0;

/// Gera identificadores únicos locais (sem dependência de servidor).
String gerarId() {
  _sequencia++;
  final tempo = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
  final sufixo = _aleatorio.nextInt(0x7fffffff).toRadixString(36);
  return '$tempo-$_sequencia-$sufixo';
}
