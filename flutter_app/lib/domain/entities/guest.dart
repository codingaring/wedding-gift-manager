class Guest {
  final int id;
  final String deviceId;
  final int localId;
  final String name;
  final String? relation;
  final String side;
  final int amount;
  final String paymentMethod; // 'cash' | 'transfer'
  final String? memo;
  final DateTime createdAt;
  final DateTime? syncedAt;

  const Guest({
    required this.id,
    required this.deviceId,
    required this.localId,
    required this.name,
    this.relation,
    required this.side,
    this.amount = 0,
    this.paymentMethod = 'cash',
    this.memo,
    required this.createdAt,
    this.syncedAt,
  });

  Guest copyWith({
    int? id,
    String? deviceId,
    int? localId,
    String? name,
    String? relation,
    String? side,
    int? amount,
    String? paymentMethod,
    String? memo,
    DateTime? createdAt,
    DateTime? syncedAt,
  }) {
    return Guest(
      id: id ?? this.id,
      deviceId: deviceId ?? this.deviceId,
      localId: localId ?? this.localId,
      name: name ?? this.name,
      relation: relation ?? this.relation,
      side: side ?? this.side,
      amount: amount ?? this.amount,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      memo: memo ?? this.memo,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }
}
