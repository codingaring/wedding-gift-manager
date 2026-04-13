import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/guest.dart';
import '../../domain/entities/guest_summary.dart';
import '../../presentation/providers/providers.dart';

class GuestListState {
  final List<Guest> guests;
  final List<Guest> filteredGuests;
  final GuestSummary summary;
  final String searchQuery;
  final String side;
  final bool isLoading;

  const GuestListState({
    this.guests = const [],
    this.filteredGuests = const [],
    this.summary = const GuestSummary(),
    this.searchQuery = '',
    this.side = 'groom',
    this.isLoading = true,
  });

  GuestListState copyWith({
    List<Guest>? guests,
    List<Guest>? filteredGuests,
    GuestSummary? summary,
    String? searchQuery,
    String? side,
    bool? isLoading,
  }) {
    return GuestListState(
      guests: guests ?? this.guests,
      filteredGuests: filteredGuests ?? this.filteredGuests,
      summary: summary ?? this.summary,
      searchQuery: searchQuery ?? this.searchQuery,
      side: side ?? this.side,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class GuestListNotifier extends StateNotifier<GuestListState> {
  final Ref _ref;
  StreamSubscription<List<Guest>>? _subscription;

  GuestListNotifier(this._ref, {required String side})
    : super(GuestListState(side: side)) {
    _watchGuests();
  }

  void _watchGuests() {
    _subscription?.cancel();
    final repo = _ref.read(guestRepositoryProvider);
    _subscription = repo.watchGuests().listen((allGuests) {
      // 현재 side만 필터
      final sideGuests = allGuests.where((g) => g.side == state.side).toList();
      state = state.copyWith(
        guests: sideGuests,
        filteredGuests: _applySearch(sideGuests, state.searchQuery),
        isLoading: false,
      );
      _loadSummary(sideGuests);
    });
  }

  void _loadSummary(List<Guest> guests) {
    var totalAmount = 0;
    var cashCount = 0;
    var cashAmount = 0;
    var transferCount = 0;
    var transferAmount = 0;
    for (final g in guests) {
      totalAmount += g.amount;
      if (g.paymentMethod == 'transfer') {
        transferCount++;
        transferAmount += g.amount;
      } else {
        cashCount++;
        cashAmount += g.amount;
      }
    }
    state = state.copyWith(
      summary: GuestSummary(
        totalCount: guests.length,
        totalAmount: totalAmount,
        cashCount: cashCount,
        cashAmount: cashAmount,
        transferCount: transferCount,
        transferAmount: transferAmount,
      ),
    );
  }

  /// DB에서 현재 side 데이터를 다시 로드
  Future<void> reload() async {
    final repo = _ref.read(guestRepositoryProvider);
    final allGuests = await repo.getGuests();
    final sideGuests = allGuests.where((g) => g.side == state.side).toList();
    state = state.copyWith(
      guests: sideGuests,
      filteredGuests: _applySearch(sideGuests, state.searchQuery),
      isLoading: false,
    );
    _loadSummary(sideGuests);
  }

  Future<Guest> addGuest(Guest guest) async {
    final repo = _ref.read(guestRepositoryProvider);
    final saved = await repo.addGuest(guest);
    await reload();
    return saved;
  }

  void switchSide(String newSide) {
    state = state.copyWith(side: newSide, searchQuery: '', isLoading: true);
    _watchGuests();
  }

  void search(String query) {
    state = state.copyWith(
      searchQuery: query,
      filteredGuests: _applySearch(state.guests, query),
    );
  }

  List<Guest> _applySearch(List<Guest> guests, String query) {
    if (query.isEmpty) return guests;
    final lower = query.toLowerCase();
    return guests.where((g) => g.name.toLowerCase().contains(lower)).toList();
  }

  Future<void> updateGuest(Guest guest) async {
    final repo = _ref.read(guestRepositoryProvider);
    await repo.updateGuest(guest);
    await reload();
  }

  Future<void> deleteGuest(int id) async {
    final repo = _ref.read(guestRepositoryProvider);
    await repo.deleteGuest(id);
    await reload();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final guestListNotifierProvider =
    StateNotifierProvider<GuestListNotifier, GuestListState>((ref) {
      // 초기 side는 config에서 읽어옴 (router에서 전달)
      return GuestListNotifier(ref, side: 'groom');
    });
