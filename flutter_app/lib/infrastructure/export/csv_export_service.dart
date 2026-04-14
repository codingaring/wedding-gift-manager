// Design Ref: §4.2 — CsvExportService (Option C Pragmatic)
// Plan SC: FR-11 CSV 내보내기 (관리자웹 업로드용)

import 'dart:convert';
import 'dart:io';

import '../database/app_database.dart';

class CsvExportService {
  final AppDatabase _db;

  CsvExportService(this._db);

  static const _header = 'name,relation,side,amount,paymentMethod,memo,date';

  /// 전체 수납 데이터를 CSV 파일로 내보내기
  /// [savePath] 사용자가 선택한 저장 경로
  /// Returns: 저장된 파일 경로
  Future<String> exportToCsv(String savePath) async {
    final guests = await _db.select(_db.guests).get();
    final rows = guests.map((g) => [
          _escape(g.name),
          _escape(g.relation ?? ''),
          g.side,
          g.amount.toString(),
          g.paymentMethod,
          _escape(g.memo ?? ''),
          g.createdAt.toIso8601String(),
        ].join(','));

    final csv = [_header, ...rows].join('\n');

    final file = File(savePath);
    // UTF-8 BOM for Excel 한글 호환
    final bom = [0xEF, 0xBB, 0xBF];
    await file.writeAsBytes([...bom, ...utf8.encode(csv)]);

    return file.path;
  }

  /// CSV 특수문자 이스케이프 (콤마, 따옴표, 개행 포함 시)
  String _escape(String value) {
    if (value.contains(',') || value.contains('"') || value.contains('\n')) {
      return '"${value.replaceAll('"', '""')}"';
    }
    return value;
  }
}
