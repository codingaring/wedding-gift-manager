import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/utils/number_format.dart';
import '../../domain/entities/guest.dart';
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

class _GuestListScreenState extends ConsumerState<GuestListScreen>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(guestListNotifierProvider.notifier).switchSide(widget.deviceId);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guestListNotifierProvider);
    final backupService = ref.watch(backupServiceProvider);
    final currentSide = DeviceSide.values.firstWhere(
      (s) => s.id == state.side,
      orElse: () => DeviceSide.groom,
    );
    final otherSide = currentSide == DeviceSide.groom
        ? DeviceSide.bride
        : DeviceSide.groom;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('축의금 수납'),
            const SizedBox(width: 8),
            ActionChip(
              avatar: Icon(
                Icons.swap_horiz,
                size: 16,
                color: theme.colorScheme.onPrimaryContainer,
              ),
              label: Text(
                '${currentSide.label} 측',
                style: TextStyle(
                  color: theme.colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold,
                ),
              ),
              backgroundColor: theme.colorScheme.primaryContainer,
              onPressed: () => _onSwitchSide(otherSide),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download_outlined),
            tooltip: 'CSV 내보내기',
            onPressed: _onExportCsv,
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.cloud_done_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  backupService.lastBackupTime != null
                      ? '백업 ${_formatTime(backupService.lastBackupTime!)}'
                      : '백업 대기',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.list_alt), text: '수납 목록'),
            Tab(icon: Icon(Icons.bar_chart), text: '통계'),
          ],
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _ListTab(
                  state: state,
                  searchController: _searchController,
                  onSearch: (v) {
                    ref.read(guestListNotifierProvider.notifier).search(v);
                    setState(() {});
                  },
                  onClearSearch: () {
                    _searchController.clear();
                    ref.read(guestListNotifierProvider.notifier).search('');
                    setState(() {});
                  },
                  onEdit: _onEdit,
                  onDelete: _onDelete,
                ),
                _StatsTab(state: state),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _onAdd,
        icon: const Icon(Icons.add),
        label: const Text('추가'),
      ),
    );
  }

  void _onSwitchSide(DeviceSide newSide) {
    _searchController.clear();
    ref.read(guestListNotifierProvider.notifier).switchSide(newSide.id);
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:'
        '${time.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _onExportCsv() async {
    final result = await FilePicker.platform.saveFile(
      dialogTitle: 'CSV 저장 위치 선택',
      fileName: 'wedding_gift_${DateTime.now().toIso8601String().split('T').first}.csv',
      type: FileType.custom,
      allowedExtensions: ['csv'],
    );

    if (result == null) return; // 사용자 취소

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

    if (amount == 0 && mounted) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('금액 확인'),
          content: const Text('금액이 0원입니다. 저장하시겠습니까?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('취소'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('저장'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('PIN이 일치하지 않습니다')));
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
              backgroundColor: Theme.of(ctx).colorScheme.error,
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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('삭제됨')));
      }
    }
  }
}

// ─────────────────────────────────────────────
// 탭 1: 수납 목록 (건수만 표시, 금액 합계 숨김)
// ─────────────────────────────────────────────

class _ListTab extends StatelessWidget {
  final GuestListState state;
  final TextEditingController searchController;
  final ValueChanged<String> onSearch;
  final VoidCallback onClearSearch;
  final void Function(Guest) onEdit;
  final void Function(Guest) onDelete;

  const _ListTab({
    required this.state,
    required this.searchController,
    required this.onSearch,
    required this.onClearSearch,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        // 건수 바 + 검색
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              // 건수 뱃지
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '총 ${state.summary.totalCount}건',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // 검색
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: TextField(
                    controller: searchController,
                    decoration: InputDecoration(
                      hintText: '이름 검색...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                      suffixIcon: searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: onClearSearch,
                            )
                          : null,
                    ),
                    onChanged: onSearch,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // 테이블 헤더
        Container(
          color: theme.colorScheme.surfaceContainerHighest,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: const Row(
            children: [
              SizedBox(
                width: 40,
                child: Text('#', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              Expanded(
                flex: 3,
                child: Text(
                  '이름',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  '관계',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  '금액',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              SizedBox(width: 80),
            ],
          ),
        ),

        // 테이블 바디
        Expanded(
          child: state.filteredGuests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 48,
                        color: theme.colorScheme.outline,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        state.searchQuery.isNotEmpty
                            ? '검색 결과가 없습니다'
                            : '아직 수납 내역이 없습니다',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: theme.colorScheme.outline,
                        ),
                      ),
                      if (state.searchQuery.isEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          '우측 하단 + 버튼으로 추가하세요',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.outline,
                          ),
                        ),
                      ],
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: state.filteredGuests.length,
                  itemBuilder: (context, index) {
                    final guest = state.filteredGuests[index];
                    return _GuestRow(
                      index: index + 1,
                      guest: guest,
                      isEven: index.isEven,
                      onEdit: () => onEdit(guest),
                      onDelete: () => onDelete(guest),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// 탭 2: 통계 (금액 합계 — 의도적으로 접근해야 볼 수 있음)
// ─────────────────────────────────────────────

class _StatsTab extends StatelessWidget {
  final GuestListState state;

  const _StatsTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final summary = state.summary;

    if (summary.totalCount == 0) {
      return Center(
        child: Text(
          '수납 내역이 없습니다',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.outline,
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          SummaryCard(summary: summary),
          const SizedBox(height: 16),

          // 관계별 통계
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '관계별 통계',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._buildRelationStats(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildRelationStats(BuildContext context) {
    final theme = Theme.of(context);
    // 관계별로 그룹핑
    final Map<String, _RelationStat> stats = {};
    for (final guest in state.guests) {
      final rel = guest.relation ?? '미지정';
      stats.putIfAbsent(rel, () => _RelationStat());
      stats[rel]!.count++;
      stats[rel]!.amount += guest.amount;
    }

    final sorted = stats.entries.toList()
      ..sort((a, b) => b.value.amount.compareTo(a.value.amount));

    return sorted
        .map(
          (e) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                SizedBox(
                  width: 80,
                  child: Text(
                    e.key,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${e.value.count}건',
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                const Spacer(),
                Text(
                  '${formatAmount(e.value.amount)}원',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        )
        .toList();
  }
}

class _RelationStat {
  int count = 0;
  int amount = 0;
}

// ─────────────────────────────────────────────
// 테이블 행
// ─────────────────────────────────────────────

class _GuestRow extends StatelessWidget {
  final int index;
  final Guest guest;
  final bool isEven;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _GuestRow({
    required this.index,
    required this.guest,
    required this.isEven,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      color: isEven ? null : theme.colorScheme.surfaceContainerLowest,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Text(
              '$index',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              guest.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              guest.relation ?? '-',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              '${formatAmount(guest.amount)}원',
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(
            width: 80,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SizedBox(
                  width: 32,
                  height: 32,
                  child: IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    onPressed: onEdit,
                    padding: EdgeInsets.zero,
                    tooltip: '수정',
                  ),
                ),
                SizedBox(
                  width: 32,
                  height: 32,
                  child: IconButton(
                    icon: Icon(
                      Icons.delete_outline,
                      size: 18,
                      color: theme.colorScheme.error,
                    ),
                    onPressed: onDelete,
                    padding: EdgeInsets.zero,
                    tooltip: '삭제',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
