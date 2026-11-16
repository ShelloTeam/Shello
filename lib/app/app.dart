import 'package:cupertino_ui/cupertino_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:flutter_localizations/flutter_localizations.dart'
    show GlobalWidgetsLocalizations;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/preferencias/domain/preferencias_usuario.dart';
import '../features/preferencias/presentation/preferencias_providers.dart';
import 'router/app_router.dart';
import 'theme/shello_theme.dart';

/// Raiz do aplicativo Shello: tema claro/escuro, idioma pt-BR e roteamento.
class ShelloApp extends ConsumerWidget {
  const ShelloApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roteador = ref.watch(roteadorProvider);
    final tema = ref.watch(preferenciasProvider.select((p) => p.tema));
    return MaterialApp.router(
      title: 'Shello',
      debugShowCheckedModeBanner: false,
      theme: temaClaro(),
      darkTheme: temaEscuro(),
      themeMode: tema == TemaApp.escuro ? ThemeMode.dark : ThemeMode.light,
      routerConfig: roteador,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
