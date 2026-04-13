import '../entities/app_config.dart';

abstract class ConfigRepository {
  Future<AppConfig?> getConfig();
  Future<void> saveConfig(AppConfig config);
  Future<bool> verifyPin(String pin);
}
