import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/repositories/config_repository.dart';
import '../../domain/repositories/guest_repository.dart';
import '../../infrastructure/backup/backup_service.dart';
import '../../infrastructure/database/app_database.dart';
import '../../infrastructure/export/csv_export_service.dart';
import '../../infrastructure/repositories/config_repository_impl.dart';
import '../../infrastructure/repositories/guest_repository_impl.dart';

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

final guestRepositoryProvider = Provider<GuestRepository>((ref) {
  return GuestRepositoryImpl(ref.watch(appDatabaseProvider));
});

final configRepositoryProvider = Provider<ConfigRepository>((ref) {
  return ConfigRepositoryImpl(ref.watch(appDatabaseProvider));
});

final backupServiceProvider = Provider<BackupService>((ref) {
  final service = BackupService();
  ref.onDispose(() => service.stop());
  return service;
});

final csvExportServiceProvider = Provider<CsvExportService>((ref) {
  return CsvExportService(ref.watch(appDatabaseProvider));
});
