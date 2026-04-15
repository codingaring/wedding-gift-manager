import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/utils/number_format.dart';
import '../../domain/entities/guest.dart';
import '../../main.dart';
import '../notifiers/guest_list_notifier.dart';
import '../providers/providers.dart';
import '../widgets/guest_form_dialog.dart';
import '../widgets/pin_dialog.dart';
import '../widgets/summary_card.dart';

class GuestListScreen extends ConsumerStatefulWidget {
  final String deviceId;

  const GuestListScreen({super.key, required this.deviceId});

  @override
  ConsumerState<GuestListScreen> createState() => _GuestListScreenState();
}

class _GuestListScreenState extends ConsumerState<GuestListScreen> {
  final _searchController = TextEditingController();
  int _tabIndex = 0;
  bool _isSearchOpen = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(guestListNotifierProvider.notifier).switchSide(widget.deviceId);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guestListNotifierProvider);
    final currentSide = DeviceSide.values.firstWhere(
      (s) => s.id == state.side,
      orElse: () => DeviceSide.groom,
    );
    final otherSide = currentSide == DeviceSide.groom
        ? DeviceSide.bride
        : DeviceSide.groom;

    return Scaffold(
      appBar: AppBar(
        title: const Text('축의금 수납'),
        actions: [
          // 검색 토글
          IconButton(
            icon: Icon(
              _isSearchOpen ? Icons.close : Icons.search,
              size: 20,
            ),
            onPressed: () {
              setState(() {
                _isSearchOpen = !_isSearchOpen;
                if (!_isSearchOpen) {
                  _searchController.clear();
                  ref.read(guestListNotifierProvider.notifier).search('');
                }
              });
            },
          ),
          // 내보내기
          IconButton(
            icon: const Icon(Icons.download_rounded, size: 20),
            tooltip: 'CSV 내보내기',
            onPressed: _onExportCsv,
          ),
          const SizedBox(width: 4),
          // 측 전환
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _SideToggle(
              currentSide: currentSide,
              onSwitch: () => _onSwitchSide(otherSide),
            ),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Column(
              children: [
                // 검색 바
                if (_isSearchOpen)
                  _SearchBar(
                    controller: _searchController,
                    onChanged: (v) {
                      ref.read(guestListNotifierProvider.notifier).search(v);
                      setState(() {});
                    },
                    onClear: () {
                      _searchController.clear();
                      ref.read(guestListNotifierProvider.notifier).search('');
                      setState(() {});
                    },
                  ),

                // 세그먼트 탭
                _SegmentTab(
                  selectedIndex: _tabIndex,
                  totalCount: state.summary.totalCount,
                  onChanged: (i) => setState(() => _tabIndex = i),
                ),

                // 탭 컨텐츠
                Expanded(
                  child: _tabIndex == 0
                      ? _ListContent(
                          state: state,
                          onEdit: _onEdit,
                          onDelete: _onDelete,
                        )
                      : _StatsContent(state: state),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _onAdd,
        child: const Icon(Icons.add, size: 24),
      ),
    );
  }

  void _onSwitchSide(DeviceSide newSide) {
    _searchController.clear();
    ref.read(guestListNotifierProvider.notifier).switchSide(newSide.id);
  }

  Future<void> _onExportCsv() async {
    final result = await FilePicker.platform.saveFile(
      dialogTitle: 'CSV 저장 위치 선택',
      fileName:
          'wedding_gift_${DateTime.now().toIso8601String().split('T').first}.csv',
      type: FileType.custom,
      allowedExtensions: ['csv'],
    );

    if (result == null) return;

    try {
      final exportService = ref.read(csvExportServiceProvider);
      final path = await exportService.exportToCsv(result);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('CSV 내보내기 완료: $path')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('내보내기 실패. 저장 경로를 확인해주세요')),
        );
      }
    }
  }

  Future<void> _onAdd() async {
    final result = await showAddGuestDialog(context);
    if (result == null) return;

    final notifier = ref.read(guestListNotifierProvider.notifier);
    final currentSide = ref.read(guestListNotifierProvider).side;
    final repo = ref.read(guestRepositoryProvider);
    final localId = await repo.getNextLocalId(currentSide);
    final amount = result['amount'] as int;

    final guest = Guest(
      id: 0,
      deviceId: currentSide,
      localId: localId,
      name: result['name'] as String,
      relation: result['relation'] as String?,
      side: currentSide,
      amount: amount,
      paymentMethod: 'cash',
      mealTickets: result['mealTickets'] as int? ?? 0,
      memo: result['memo'] as String?,
      createdAt: DateTime.now(),
    );

    await notifier.addGuest(guest);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${guest.name} — ${formatAmount(amount)}원 저장됨'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _onEdit(Guest guest) async {
    final updated = await showEditGuestDialog(context, guest);
    if (updated != null) {
      ref.read(guestListNotifierProvider.notifier).updateGuest(updated);
    }
  }

  Future<void> _onDelete(Guest guest) async {
    final pin = await showPinDialog(context);
    if (pin == null || !mounted) return;

    final valid = await ref.read(configRepositoryProvider).verifyPin(pin);
    if (!valid) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PIN이 일치하지 않습니다')),
        );
      }
      return;
    }

    if (!mounted) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('삭제 확인'),
        content: Text('"${guest.name}" 항목을 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.destructive,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      ref.read(guestListNotifierProvider.notifier).deleteGuest(guest.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('삭제됨')),
        );
      }
    }
  }
}

// ─── 측 전환 버튼 ───

class _SideToggle extends StatelessWidget {
  final DeviceSide currentSide;
  final VoidCallback onSwitch;

  const _SideToggle({required this.currentSide, required this.onSwitch});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSwitch,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.zinc900,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${currentSide.label} 측',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.swap_horiz, size: 16, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}

// ─── 검색 바 ───

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _SearchBar({
    required this.controller,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: SizedBox(
        height: 40,
        child: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: '이름으로 검색',
            prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.mutedForeground),
            suffixIcon: controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.close, size: 16),
                    onPressed: onClear,
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            filled: true,
            fillColor: AppColors.zinc50,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

// ─── 세그먼트 탭 ───

class _SegmentTab extends StatelessWidget {
  final int selectedIndex;
  final int totalCount;
  final ValueChanged<int> onChanged;

  const _SegmentTab({
    required this.selectedIndex,
    required this.totalCount,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.muted,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            _buildTab(0, '목록', '$totalCount'),
            _buildTab(1, '통계', null),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int index, String label, String? badge) {
    final isSelected = selectedIndex == index;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(3),
        child: Material(
          color: isSelected ? AppColors.background : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          elevation: isSelected ? 1 : 0,
          shadowColor: Colors.black26,
          child: InkWell(
            onTap: () => onChanged(index),
            borderRadius: BorderRadius.circular(6),
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            child: SizedBox(
              height: double.infinity,
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                        color: isSelected
                            ? AppColors.foreground
                            : AppColors.mutedForeground,
                      ),
                    ),
                    if (badge != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.zinc200
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: isSelected
                                ? AppColors.foreground
                                : AppColors.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── 목록 컨텐츠 ───

class _ListContent extends StatelessWidget {
  final GuestListState state;
  final void Function(Guest) onEdit;
  final void Function(Guest) onDelete;

  const _ListContent({
    required this.state,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (state.filteredGuests.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.zinc100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.inbox_outlined,
                size: 28,
                color: AppColors.zinc400,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              state.searchQuery.isNotEmpty ? '검색 결과가 없습니다' : '아직 수납 내역이 없습니다',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppColors.foreground,
              ),
            ),
            if (state.searchQuery.isEmpty) ...[
              const SizedBox(height: 4),
              const Text(
                '+ 버튼을 눌러 추가해보세요',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: state.filteredGuests.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final guest = state.filteredGuests[index];
        return _GuestTile(
          guest: guest,
          onEdit: () => onEdit(guest),
          onDelete: () => onDelete(guest),
        );
      },
    );
  }
}

// ─── 게스트 타일 ───

class _GuestTile extends StatelessWidget {
  final Guest guest;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _GuestTile({
    required this.guest,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onEdit,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            // 아바타
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.zinc100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  guest.name.isNotEmpty ? guest.name[0] : '?',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.zinc600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // 이름 + 관계
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    guest.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                  ),
                  Text(
                    [
                      if (guest.relation != null) guest.relation!,
                      '${guest.createdAt.hour.toString().padLeft(2, '0')}:${guest.createdAt.minute.toString().padLeft(2, '0')}',
                    ].join(' · '),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),

            // 식권
            if (guest.mealTickets > 0)
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.zinc100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '식권 ${guest.mealTickets}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.zinc600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

            // 금액
            Text(
              guest.amount == 0
                  ? '미기입'
                  : '${formatAmount(guest.amount)}원',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: guest.amount == 0
                    ? AppColors.mutedForeground
                    : AppColors.foreground,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),

            // 더보기
            const SizedBox(width: 4),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 18, color: AppColors.zinc400),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              style: const ButtonStyle(
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                minimumSize: WidgetStatePropertyAll(Size(32, 32)),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: AppColors.border),
              ),
              elevation: 4,
              onSelected: (v) {
                if (v == 'edit') onEdit();
                if (v == 'delete') onDelete();
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'edit',
                  height: 40,
                  child: Row(
                    children: [
                      Icon(Icons.edit_outlined, size: 16, color: AppColors.zinc600),
                      SizedBox(width: 8),
                      Text('수정', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  height: 40,
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline, size: 16,
                          color: AppColors.destructive),
                      SizedBox(width: 8),
                      Text('삭제',
                          style: TextStyle(
                              fontSize: 14, color: AppColors.destructive)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 통계 컨텐츠 ───

class _StatsContent extends StatelessWidget {
  final GuestListState state;

  const _StatsContent({required this.state});

  @override
  Widget build(BuildContext context) {
    final summary = state.summary;

    if (summary.totalCount == 0) {
      return const Center(
        child: Text(
          '수납 내역이 없습니다',
          style: TextStyle(
            fontSize: 15,
            color: AppColors.mutedForeground,
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SummaryCard(summary: summary),
          const SizedBox(height: 16),

          // 관계별 통계
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '관계별 통계',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 16),
                ..._buildRelationStats(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildRelationStats() {
    final Map<String, _RelationStat> stats = {};
    for (final guest in state.guests) {
      final rel = guest.relation ?? '미지정';
      stats.putIfAbsent(rel, () => _RelationStat());
      stats[rel]!.count++;
      stats[rel]!.amount += guest.amount;
    }

    final sorted = stats.entries.toList()
      ..sort((a, b) => b.value.amount.compareTo(a.value.amount));

    return sorted.map((e) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.zinc400,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              e.key,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: AppColors.zinc100,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${e.value.count}건',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
            const Spacer(),
            Text(
              '${formatAmount(e.value.amount)}원',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }
}

class _RelationStat {
  int count = 0;
  int amount = 0;
}
