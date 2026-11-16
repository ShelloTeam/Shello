import 'package:shared_preferences/shared_preferences.dart';

import 'key_value_store.dart';

/// Armazenamento persistente no dispositivo (SharedPreferences).
/// Leituras são síncronas porque o [SharedPreferences] já foi carregado.
class SharedPreferencesKeyValueStore implements KeyValueStore {
  SharedPreferencesKeyValueStore(this._prefs);

  final SharedPreferences _prefs;

  @override
  String? ler(String chave) => _prefs.getString(chave);

  @override
  Future<void> gravar(String chave, String valor) async {
    await _prefs.setString(chave, valor);
  }

  @override
  Future<void> remover(String chave) async {
    await _prefs.remove(chave);
  }
}
