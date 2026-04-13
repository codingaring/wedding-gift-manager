// 5분 단위 자동 백업 서비스
// 5분 자동 백업 파일 생성 확인

import 'dart:async';
import 'dart:io';

import 'package:path/path.dart' as p;

import '../../core/constants.dart';
import '../database/app_database.dart';

class BackupService {
  Timer? _timer;
  DateTime? _lastBackupTime;

  DateTime? get lastBackupTime => _lastBackupTime;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(
      const Duration(minutes: backupIntervalMinutes),
      (_) => performBackup(),
    );
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> performBackup() async {
    try {
      final dbPath = await AppDatabase.getDatabasePath();
      final dbFile = File(dbPath);
      if (!await dbFile.exists()) return;

      final backupDir = Directory(p.join(p.dirname(dbPath), 'backups'));
      if (!await backupDir.exists()) {
        await backupDir.create(recursive: true);
      }

      final timestamp = DateTime.now()
          .toIso8601String()
          .replaceAll(':', '-')
          .split('.')
          .first;
      final backupPath = p.join(backupDir.path, 'wedding_gift_$timestamp.db');

      await dbFile.copy(backupPath);
      _lastBackupTime = DateTime.now();

      // WAL 파일도 백업
      final walFile = File('$dbPath-wal');
      if (await walFile.exists()) {
        await walFile.copy('$backupPath-wal');
      }

      // 오래된 백업 정리 (최근 10개만 유지)
      await _cleanOldBackups(backupDir);
    } catch (_) {
      // 백업 실패 시 로그만 기록, 다음 주기에 재시도
    }
  }

  Future<void> _cleanOldBackups(Directory backupDir) async {
    final files = await backupDir
        .list()
        .where((f) => f is File && f.path.endsWith('.db'))
        .cast<File>()
        .toList();

    if (files.length <= 10) return;

    files.sort((a, b) => a.path.compareTo(b.path));
    final toDelete = files.sublist(0, files.length - 10);
    for (final file in toDelete) {
      await file.delete();
      // WAL 파일도 삭제
      final walFile = File('${file.path}-wal');
      if (await walFile.exists()) {
        await walFile.delete();
      }
    }
  }
}
