import '../entities/guest.dart';
import '../entities/guest_summary.dart';

abstract class GuestRepository {
  Future<Guest> addGuest(Guest guest);
  Future<List<Guest>> getGuests({String? side});
  Future<Guest> updateGuest(Guest guest);
  Future<void> deleteGuest(int id);
  Stream<List<Guest>> watchGuests();
  Future<GuestSummary> getSummary();
  Future<int> getNextLocalId(String deviceId);
}
