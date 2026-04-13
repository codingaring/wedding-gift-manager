import 'package:intl/intl.dart';

final _numberFormat = NumberFormat('#,###');

/// 숫자를 천 단위 콤마 문자열로 변환 (예: 100000 → "100,000")
String formatAmount(int amount) => _numberFormat.format(amount);

/// 콤마가 포함된 문자열을 정수로 변환 (예: "100,000" → 100000)
int parseAmount(String text) {
  final cleaned = text.replaceAll(',', '').trim();
  if (cleaned.isEmpty) return 0;
  return int.tryParse(cleaned) ?? 0;
}
