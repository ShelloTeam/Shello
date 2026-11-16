import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/bootstrap.dart';
import 'core/providers.dart';
import 'core/storage/shared_preferences_key_value_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR');

  final prefs = await SharedPreferences.getInstance();
  final store = SharedPreferencesKeyValueStore(prefs);
  await prepararArmazenamento(store: store, relogio: DateTime.now);

  runApp(
    ProviderScope(
      overrides: [keyValueStoreProvider.overrideWithValue(store)],
      child: const ShelloApp(),
    ),
  );
}
