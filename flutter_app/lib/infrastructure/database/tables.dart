import 'package:drift/drift.dart';

class Guests extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get deviceId => text()();
  IntColumn get localId => integer()();
  TextColumn get name => text().withLength(min: 1)();
  TextColumn get relation => text().nullable()();
  TextColumn get side => text()();
  IntColumn get amount => integer().withDefault(const Constant(0))();
  TextColumn get paymentMethod =>
      text().withDefault(const Constant('cash'))(); // 'cash' | 'transfer'
  TextColumn get memo => text().nullable()();
  DateTimeColumn get createdAt =>
      dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  List<Set<Column>> get uniqueKeys => [
        {deviceId, localId},
      ];
}

class AppConfigs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get deviceId => text()();
  TextColumn get pin => text().withLength(min: 4, max: 4)();
  BoolColumn get isSetupComplete =>
      boolean().withDefault(const Constant(false))();
}
