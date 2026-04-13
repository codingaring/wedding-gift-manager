import 'package:drift/drift.dart';

import '../../domain/entities/app_config.dart' as entity;
import '../../domain/repositories/config_repository.dart';
import '../database/app_database.dart';

class ConfigRepositoryImpl implements ConfigRepository {
  final AppDatabase _db;

  ConfigRepositoryImpl(this._db);

  @override
  Future<entity.AppConfig?> getConfig() async {
    final rows = await _db.select(_db.appConfigs).get();
    if (rows.isEmpty) return null;
    final row = rows.first;
    return entity.AppConfig(
      deviceId: row.deviceId,
      pin: row.pin,
      isSetupComplete: row.isSetupComplete,
    );
  }

  @override
  Future<void> saveConfig(entity.AppConfig config) async {
    // 기존 설정이 있으면 업데이트, 없으면 삽입
    final existing = await _db.select(_db.appConfigs).get();
    if (existing.isEmpty) {
      await _db
          .into(_db.appConfigs)
          .insert(
            AppConfigsCompanion.insert(
              deviceId: config.deviceId,
              pin: config.pin,
              isSetupComplete: Value(config.isSetupComplete),
            ),
          );
    } else {
      await (_db.update(
        _db.appConfigs,
      )..where((t) => t.id.equals(existing.first.id))).write(
        AppConfigsCompanion(
          deviceId: Value(config.deviceId),
          pin: Value(config.pin),
          isSetupComplete: Value(config.isSetupComplete),
        ),
      );
    }
  }

  @override
  Future<bool> verifyPin(String pin) async {
    final config = await getConfig();
    if (config == null) return false;
    return config.pin == pin;
  }
}
