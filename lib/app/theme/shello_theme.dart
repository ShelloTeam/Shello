import 'package:material_ui/material_ui.dart';

import 'shello_tokens.dart';

/// Extensão de conveniência: `context.cores` devolve a paleta do tema atual.
extension ShelloContexto on BuildContext {
  ShelloPaleta get cores => Theme.of(this).extension<ShelloPaleta>()!;
}

/// Monta o [ThemeData] Material 3 com a identidade Shello.
/// O Material só serve de infraestrutura: os componentes visuais são próprios.
ThemeData construirTema(ShelloPaleta paleta, Brightness brilho) {
  final esquema = ColorScheme.fromSeed(
    seedColor: paleta.marca,
    brightness: brilho,
    primary: paleta.marca,
    onPrimary: paleta.textoSobreMarca,
    surface: paleta.superficie,
    onSurface: paleta.textoP,
    error: paleta.erro,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brilho,
    colorScheme: esquema,
    scaffoldBackgroundColor: paleta.fundo,
    canvasColor: paleta.fundo,
    dividerColor: paleta.marcaClaro,
    extensions: <ThemeExtension<dynamic>>[paleta],
    textTheme: TextTheme(
      bodyLarge: TextStyle(
        color: paleta.textoP,
        fontSize: ShelloTipo.normal,
        height: 1.4,
      ),
      bodyMedium: TextStyle(
        color: paleta.textoP,
        fontSize: ShelloTipo.pequeno,
        height: 1.4,
      ),
      bodySmall: TextStyle(
        color: paleta.textoS,
        fontSize: ShelloTipo.minusculo,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: paleta.textoP,
      contentTextStyle: TextStyle(
        color: paleta.fundo,
        fontSize: ShelloTipo.pequeno,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: ShelloForma.raio(ShelloForma.bordaPequena),
      ),
    ),
    datePickerTheme: DatePickerThemeData(
      backgroundColor: paleta.superficie,
      headerBackgroundColor: paleta.marca,
      headerForegroundColor: paleta.textoSobreMarca,
      dayForegroundColor: WidgetStatePropertyAll(paleta.textoP),
      todayBorder: BorderSide(color: paleta.marca),
    ),
  );
}

ThemeData temaClaro() => construirTema(ShelloPaleta.claro, Brightness.light);

ThemeData temaEscuro() => construirTema(ShelloPaleta.escuro, Brightness.dark);
