/// 하객 관계 카테고리 (측 무관)
enum GuestRelation {
  friend('친구'),
  colleague('직장 동료'),
  relative('친척'),
  other('기타');

  const GuestRelation(this.label);
  final String label;
}

/// 결제 수단
enum PaymentMethod {
  cash('현금'),
  transfer('계좌이체');

  const PaymentMethod(this.id);
  final String id;
}

/// 기기 측 (신랑/신부)
enum DeviceSide {
  groom('groom', '신랑'),
  bride('bride', '신부');

  const DeviceSide(this.id, this.label);
  final String id;
  final String label;
}

/// 자동 백업 주기 (5분)
const backupIntervalMinutes = 5;

/// PIN 자릿수
const pinLength = 4;
