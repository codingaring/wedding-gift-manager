import 'package:drift/drift.dart';

import '../../domain/entities/guest.dart' as entity;
import '../../domain/entities/guest_summary.dart';
import '../../domain/repositories/guest_repository.dart';
import '../database/app_database.dart';

class GuestRepositoryImpl implements GuestRepository {
  final AppDatabase _db;

  GuestRepositoryImpl(this._db);

  @override
  Future<entity.Guest> addGuest(entity.Guest guest) async {
    final id = await _db
        .into(_db.guests)
        .insert(
          GuestsCompanion.insert(
            deviceId: guest.deviceId,
            localId: guest.localId,
            name: guest.name,
            relation: Value(guest.relation),
            side: guest.side,
            amount: Value(guest.amount),
            paymentMethod: Value(guest.paymentMethod),
            memo: Value(guest.memo),
          ),
        );
    return guest.copyWith(id: id);
  }

  @override
  Future<List<entity.Guest>> getGuests({String? side}) async {
    final query = _db.select(_db.guests);
    if (side != null) {
      query.where((t) => t.side.equals(side));
    }
    query.orderBy([(t) => OrderingTerm.desc(t.createdAt)]);
    final rows = await query.get();
    return rows.map(_toEntity).toList();
  }

  @override
  Future<entity.Guest> updateGuest(entity.Guest guest) async {
    await (_db.update(_db.guests)..where((t) => t.id.equals(guest.id))).write(
      GuestsCompanion(
        name: Value(guest.name),
        relation: Value(guest.relation),
        amount: Value(guest.amount),
        paymentMethod: Value(guest.paymentMethod),
        memo: Value(guest.memo),
      ),
    );
    return guest;
  }

  @override
  Future<void> deleteGuest(int id) async {
    await (_db.delete(_db.guests)..where((t) => t.id.equals(id))).go();
  }

  @override
  Stream<List<entity.Guest>> watchGuests() {
    final query = _db.select(_db.guests)
      ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]);
    return query.watch().map((rows) => rows.map(_toEntity).toList());
  }

  @override
  Future<GuestSummary> getSummary() async {
    final rows = await _db.select(_db.guests).get();
    var totalAmount = 0;
    var cashCount = 0;
    var cashAmount = 0;
    var transferCount = 0;
    var transferAmount = 0;
    for (final row in rows) {
      totalAmount += row.amount;
      if (row.paymentMethod == 'transfer') {
        transferCount++;
        transferAmount += row.amount;
      } else {
        cashCount++;
        cashAmount += row.amount;
      }
    }
    return GuestSummary(
      totalCount: rows.length,
      totalAmount: totalAmount,
      cashCount: cashCount,
      cashAmount: cashAmount,
      transferCount: transferCount,
      transferAmount: transferAmount,
    );
  }

  @override
  Future<int> getNextLocalId(String deviceId) async {
    final query = _db.selectOnly(_db.guests)
      ..addColumns([_db.guests.localId.max()])
      ..where(_db.guests.deviceId.equals(deviceId));
    final result = await query.getSingle();
    final maxId = result.read(_db.guests.localId.max());
    return (maxId ?? 0) + 1;
  }

  entity.Guest _toEntity(Guest row) {
    return entity.Guest(
      id: row.id,
      deviceId: row.deviceId,
      localId: row.localId,
      name: row.name,
      relation: row.relation,
      side: row.side,
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      memo: row.memo,
      createdAt: row.createdAt,
      syncedAt: row.syncedAt,
    );
  }
}
