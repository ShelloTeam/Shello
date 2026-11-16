import 'package:material_ui/material_ui.dart';

/// Paleta do Shello. Valores de [ShelloPaleta.claro] são os de `tema.ts` da
/// versão React Native. A paleta escura mantém o mesmo papel de cada cor.
@immutable
class ShelloPaleta extends ThemeExtension<ShelloPaleta> {
  const ShelloPaleta({
    required this.fundo,
    required this.superficie,
    required this.textoP,
    required this.textoS,
    required this.marca,
    required this.marcaClaro,
    required this.terracota,
    required this.terracotaIcone,
    required this.terracotaTitulo,
    required this.terracotaTexto,
    required this.pessego,
    required this.pessegoDark,
    required this.erro,
    required this.erroClaro,
    required this.online,
    required this.rotinaManha,
    required this.rotinaTarde,
    required this.rotinaNoite,
    required this.overlay,
    required this.textoSobreMarca,
  });

  static const ShelloPaleta claro = ShelloPaleta(
    fundo: Color(0xFFF7F6F0),
    superficie: Color(0xFFFFFFFF),
    textoP: Color(0xFF2D3A32),
    textoS: Color(0xFF6C757D),
    marca: Color(0xFF5E836A),
    marcaClaro: Color(0xFFD6E2D8),
    terracota: Color(0xFFEADCD6),
    terracotaIcone: Color(0xFFB5856A),
    terracotaTitulo: Color(0xFF8B5E4A),
    terracotaTexto: Color(0xFFB5856A),
    pessego: Color(0xFFF2D4C8),
    pessegoDark: Color(0xFFA05A44),
    erro: Color(0xFFDC3545),
    erroClaro: Color(0xFFFDE8E8),
    online: Color(0xFF4CAF50),
    rotinaManha: Color(0xFFEEF4F0),
    rotinaTarde: Color(0xFFEADCD6),
    rotinaNoite: Color(0xFFE8E4F0),
    overlay: Color(0x662D3A32),
    textoSobreMarca: Color(0xFFFFFFFF),
  );

  static const ShelloPaleta escuro = ShelloPaleta(
    fundo: Color(0xFF1B211E),
    superficie: Color(0xFF252D28),
    textoP: Color(0xFFECF2EE),
    textoS: Color(0xFF9AA79F),
    marca: Color(0xFF7FA78B),
    marcaClaro: Color(0xFF2E3D34),
    terracota: Color(0xFF3A2F2A),
    terracotaIcone: Color(0xFFD09E7E),
    terracotaTitulo: Color(0xFFE0B39C),
    terracotaTexto: Color(0xFFD09E7E),
    pessego: Color(0xFF4A3A33),
    pessegoDark: Color(0xFFF0B9A3),
    erro: Color(0xFFF07178),
    erroClaro: Color(0xFF4A2A2D),
    online: Color(0xFF66BB6A),
    rotinaManha: Color(0xFF26332B),
    rotinaTarde: Color(0xFF3A2F2A),
    rotinaNoite: Color(0xFF2E2B3A),
    overlay: Color(0x99000000),
    textoSobreMarca: Color(0xFF13201A),
  );

  /// Cor de fundo geral do app.
  final Color fundo;

  /// Cards, inputs e modais.
  final Color superficie;

  /// Títulos e textos principais.
  final Color textoP;

  /// Legendas, placeholders e metadados.
  final Color textoS;

  /// Verde sálvia oficial do mascote.
  final Color marca;
  final Color marcaClaro;

  /// Salmão suave, usado em CTAs secundários.
  final Color terracota;
  final Color terracotaIcone;
  final Color terracotaTitulo;
  final Color terracotaTexto;

  /// Pêssego, usado em botões e destaques.
  final Color pessego;
  final Color pessegoDark;

  /// Atrasos e exclusões.
  final Color erro;
  final Color erroClaro;

  /// Indicador de "online" do cabeçalho do chat.
  final Color online;

  /// Fundos dos cards de rotina por período.
  final Color rotinaManha;
  final Color rotinaTarde;
  final Color rotinaNoite;

  /// Véu escurecido atrás de diálogos e modais.
  final Color overlay;

  /// Texto e ícones colocados sobre a cor de marca.
  final Color textoSobreMarca;

  @override
  ShelloPaleta copyWith() => this;

  @override
  ShelloPaleta lerp(ThemeExtension<ShelloPaleta>? other, double t) {
    if (other is! ShelloPaleta) return this;
    return ShelloPaleta(
      fundo: Color.lerp(fundo, other.fundo, t)!,
      superficie: Color.lerp(superficie, other.superficie, t)!,
      textoP: Color.lerp(textoP, other.textoP, t)!,
      textoS: Color.lerp(textoS, other.textoS, t)!,
      marca: Color.lerp(marca, other.marca, t)!,
      marcaClaro: Color.lerp(marcaClaro, other.marcaClaro, t)!,
      terracota: Color.lerp(terracota, other.terracota, t)!,
      terracotaIcone: Color.lerp(terracotaIcone, other.terracotaIcone, t)!,
      terracotaTitulo: Color.lerp(terracotaTitulo, other.terracotaTitulo, t)!,
      terracotaTexto: Color.lerp(terracotaTexto, other.terracotaTexto, t)!,
      pessego: Color.lerp(pessego, other.pessego, t)!,
      pessegoDark: Color.lerp(pessegoDark, other.pessegoDark, t)!,
      erro: Color.lerp(erro, other.erro, t)!,
      erroClaro: Color.lerp(erroClaro, other.erroClaro, t)!,
      online: Color.lerp(online, other.online, t)!,
      rotinaManha: Color.lerp(rotinaManha, other.rotinaManha, t)!,
      rotinaTarde: Color.lerp(rotinaTarde, other.rotinaTarde, t)!,
      rotinaNoite: Color.lerp(rotinaNoite, other.rotinaNoite, t)!,
      overlay: Color.lerp(overlay, other.overlay, t)!,
      textoSobreMarca: Color.lerp(textoSobreMarca, other.textoSobreMarca, t)!,
    );
  }
}

/// Espaçamentos do `tema.ts` (xs a xxl).
abstract final class ShelloEspaco {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

/// Raios de borda do `tema.ts`.
abstract final class ShelloForma {
  static const double bordaGrande = 32;
  static const double bordaMedia = 24;
  static const double bordaPequena = 16;
  static const double bordaPill = 50;

  static BorderRadius raio(double valor) => BorderRadius.circular(valor);
}

/// Tipografia do `tema.ts`. Títulos usam a família serifada do sistema.
abstract final class ShelloTipo {
  static const String titulo = 'serif';

  static const double gigante = 32;
  static const double grande = 28;
  static const double medio = 20;
  static const double normal = 16;
  static const double pequeno = 14;
  static const double minusculo = 12;

  static const double alturaLinha = 22;
}

/// Sombras do `tema.ts` (suave e média), como lista de [BoxShadow].
abstract final class ShelloSombra {
  static List<BoxShadow> suave([Color cor = const Color(0xFF000000)]) => [
    BoxShadow(
      color: cor.withValues(alpha: 0.06),
      offset: const Offset(0, 2),
      blurRadius: 8,
    ),
  ];

  static List<BoxShadow> media([Color cor = const Color(0xFF000000)]) => [
    BoxShadow(
      color: cor.withValues(alpha: 0.10),
      offset: const Offset(0, 4),
      blurRadius: 12,
    ),
  ];
}
