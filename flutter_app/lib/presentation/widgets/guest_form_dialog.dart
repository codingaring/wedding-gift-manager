// 수납 추가/수정 바텀시트 — shadcn/ui 스타일

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';
import '../../core/utils/number_format.dart';
import '../../domain/entities/guest.dart';
import '../../main.dart';

/// 추가 모달
Future<Map<String, dynamic>?> showAddGuestDialog(BuildContext context) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppColors.background,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => const _GuestFormSheet(),
  );
}

/// 수정 모달
Future<Guest?> showEditGuestDialog(BuildContext context, Guest guest) {
  return showModalBottomSheet<Guest>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppColors.background,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => _GuestFormSheet(guest: guest),
  );
}

class _GuestFormSheet extends StatefulWidget {
  final Guest? guest;
  const _GuestFormSheet({this.guest});

  bool get isEditing => guest != null;

  @override
  State<_GuestFormSheet> createState() => _GuestFormSheetState();
}

class _GuestFormSheetState extends State<_GuestFormSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _amountController;
  late final TextEditingController _memoController;
  late final TextEditingController _customRelationController;
  late final TextEditingController _mealTicketsController;
  GuestRelation? _selectedRelation;
  int _mealTickets = 0;
  final _formKey = GlobalKey<FormState>();
  final _nameFocus = FocusNode();
  final _amountInputFocus = FocusNode();
  final _mealTicketsInputFocus = FocusNode();
  final _memoFocus = FocusNode();
  final _submitFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    final g = widget.guest;
    _nameController = TextEditingController(text: g?.name ?? '');
    _amountController = TextEditingController(
      text: (g != null && g.amount > 0) ? formatAmount(g.amount) : '',
    );
    _memoController = TextEditingController(text: g?.memo ?? '');
    _customRelationController = TextEditingController();
    _mealTickets = g?.mealTickets ?? 0;
    _mealTicketsController = TextEditingController(
      text: _mealTickets.toString(),
    );

    if (g?.relation != null) {
      _selectedRelation = GuestRelation.values
          .cast<GuestRelation?>()
          .firstWhere((r) => r?.label == g!.relation, orElse: () => null);
      if (_selectedRelation == null && g!.relation != null) {
        _selectedRelation = GuestRelation.other;
        _customRelationController.text = g.relation!;
      }
    }

    if (!widget.isEditing) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _nameFocus.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _memoController.dispose();
    _customRelationController.dispose();
    _mealTicketsController.dispose();
    _nameFocus.dispose();
    _amountInputFocus.dispose();
    _mealTicketsInputFocus.dispose();
    _memoFocus.dispose();
    _submitFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) {
          return Form(
            key: _formKey,
            child: Column(
              children: [
                // 드래그 핸들 + 헤더
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
                  child: Column(
                    children: [
                      // 핸들
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.zinc300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text(
                            widget.isEditing ? '수납 수정' : '수납 추가',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: AppColors.foreground,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const Spacer(),
                          ExcludeFocus(
                            child: IconButton(
                              icon: const Icon(Icons.close, size: 20),
                              onPressed: () => Navigator.pop(context),
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.zinc100,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Divider(),

                // 폼 본문
                Expanded(
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                    children: [
                      // 이름
                      _FieldLabel('이름'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _nameController,
                        focusNode: _nameFocus,
                        decoration: const InputDecoration(
                          hintText: '하객 이름 입력',
                          isDense: true,
                        ),
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? '이름을 입력하세요' : null,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 20),

                      // 금액
                      _FieldLabel('금액'),
                      const SizedBox(height: 6),
                      _ChipGroup(
                        labels: const ['3만', '5만', '10만', '15만', '20만', '25만', '30만'],
                        selectedIndex: [3, 5, 10, 15, 20, 25, 30].indexWhere(
                          (amt) => parseAmount(_amountController.text) == amt * 10000,
                        ),
                        nextFocus: _amountInputFocus,
                        onSelected: (i) {
                          final amt = [3, 5, 10, 15, 20, 25, 30][i];
                          _amountController.text = formatAmount(amt * 10000);
                          setState(() {});
                        },
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _amountController,
                        focusNode: _amountInputFocus,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        decoration: const InputDecoration(
                          hintText: '직접 입력',
                          isDense: true,
                          suffixText: '원',
                        ),
                        onChanged: (_) {
                          _formatField(_amountController);
                          setState(() {});
                        },
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 20),

                      // 관계
                      _FieldLabel('관계'),
                      const SizedBox(height: 6),
                      _ChipGroup(
                        labels: GuestRelation.values.map((r) => r.label).toList(),
                        selectedIndex: _selectedRelation == null
                            ? -1
                            : GuestRelation.values.indexOf(_selectedRelation!),
                        onSelected: (i) {
                          setState(() => _selectedRelation = GuestRelation.values[i]);
                        },
                      ),

                      if (_selectedRelation == GuestRelation.other) ...[
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _customRelationController,
                          decoration: const InputDecoration(
                            hintText: '예: 대학 선배, 이웃',
                            isDense: true,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),

                      // 식권
                      _FieldLabel('식권'),
                      const SizedBox(height: 6),
                      _ChipGroup(
                        labels: const ['모름', '1장', '2장', '3장', '4장', '5장'],
                        selectedIndex: [0, 1, 2, 3, 4, 5].indexOf(_mealTickets),
                        nextFocus: _mealTicketsInputFocus,
                        onSelected: (i) {
                          final n = [0, 1, 2, 3, 4, 5][i];
                          setState(() => _mealTickets = n);
                          _mealTicketsController.text = n.toString();
                        },
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _mealTicketsController,
                        focusNode: _mealTicketsInputFocus,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        decoration: const InputDecoration(
                          hintText: '직접 입력',
                          isDense: true,
                          suffixText: '장',
                        ),
                        onChanged: (v) {
                          final parsed = int.tryParse(v) ?? 0;
                          setState(() => _mealTickets = parsed);
                        },
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 20),

                      // 메모
                      _FieldLabel('메모'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _memoController,
                        focusNode: _memoFocus,
                        decoration: const InputDecoration(
                          hintText: '선택 사항',
                          isDense: true,
                        ),
                        textInputAction: TextInputAction.next,
                        onFieldSubmitted: (_) => _submitFocus.requestFocus(),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),

                // 하단 버튼
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  decoration: const BoxDecoration(
                    border: Border(
                      top: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 44,
                          child: ExcludeFocus(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('취소'),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: SizedBox(
                          height: 44,
                          child: FilledButton(
                            focusNode: _submitFocus,
                            onPressed: _onSave,
                            child: Text(widget.isEditing ? '수정' : '추가'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _formatField(TextEditingController controller) {
    final text = controller.text.replaceAll(',', '');
    if (text.isEmpty) return;
    final value = int.tryParse(text);
    if (value == null) return;
    final formatted = formatAmount(value);
    if (formatted != controller.text) {
      controller.value = TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    }
  }

  String? _resolveRelation() {
    if (_selectedRelation == null) return null;
    if (_selectedRelation == GuestRelation.other) {
      final custom = _customRelationController.text.trim();
      return custom.isEmpty ? GuestRelation.other.label : custom;
    }
    return _selectedRelation!.label;
  }

  void _onSave() {
    if (!_formKey.currentState!.validate()) return;

    final amount = parseAmount(_amountController.text);
    final relation = _resolveRelation();
    final memo = _memoController.text.trim().isEmpty
        ? null
        : _memoController.text.trim();

    if (widget.isEditing) {
      final updated = widget.guest!.copyWith(
        name: _nameController.text.trim(),
        relation: relation,
        amount: amount,
        mealTickets: _mealTickets,
        memo: memo,
      );
      Navigator.pop(context, updated);
    } else {
      Navigator.pop(context, {
        'name': _nameController.text.trim(),
        'relation': relation,
        'amount': amount,
        'mealTickets': _mealTickets,
        'memo': memo,
      });
    }
  }
}

// ─── 공용 위젯 ───

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.foreground,
      ),
    );
  }
}

/// 칩 그룹 — 단일 Tab 스톱, 그룹 내 좌우 화살표 이동, Enter/Space 선택
class _ChipGroup extends StatefulWidget {
  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final FocusNode? nextFocus;

  const _ChipGroup({
    required this.labels,
    required this.selectedIndex,
    required this.onSelected,
    this.nextFocus,
  });

  @override
  State<_ChipGroup> createState() => _ChipGroupState();
}

class _ChipGroupState extends State<_ChipGroup> {
  final _groupFocus = FocusNode();
  int _focusedIndex = 0;
  bool _hasFocus = false;

  @override
  void initState() {
    super.initState();
    _focusedIndex = widget.selectedIndex >= 0 ? widget.selectedIndex : 0;
  }

  @override
  void didUpdateWidget(covariant _ChipGroup oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedIndex >= 0) {
      _focusedIndex = widget.selectedIndex;
    }
  }

  @override
  void dispose() {
    _groupFocus.dispose();
    super.dispose();
  }

  KeyEventResult _handleKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;

    final key = event.logicalKey;

    if (key == LogicalKeyboardKey.arrowRight ||
        key == LogicalKeyboardKey.arrowDown) {
      setState(() {
        _focusedIndex = (_focusedIndex + 1) % widget.labels.length;
      });
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.arrowLeft ||
        key == LogicalKeyboardKey.arrowUp) {
      setState(() {
        _focusedIndex =
            (_focusedIndex - 1 + widget.labels.length) % widget.labels.length;
      });
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.space) {
      widget.onSelected(_focusedIndex);
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.tab) {
      if (widget.nextFocus != null) {
        widget.nextFocus!.requestFocus();
        return KeyEventResult.handled;
      }
      // Tab 기본 동작 — 다음 포커스로 이동
      return KeyEventResult.ignored;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _groupFocus,
      onFocusChange: (focused) => setState(() => _hasFocus = focused),
      onKeyEvent: _handleKey,
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          for (int i = 0; i < widget.labels.length; i++)
            GestureDetector(
              onTap: () => widget.onSelected(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: widget.selectedIndex == i
                      ? AppColors.zinc900
                      : AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: widget.selectedIndex == i
                        ? AppColors.zinc900
                        : (_hasFocus && _focusedIndex == i)
                            ? AppColors.zinc600
                            : AppColors.border,
                    width: (_hasFocus && _focusedIndex == i &&
                            widget.selectedIndex != i)
                        ? 2
                        : 1,
                  ),
                  boxShadow: (_hasFocus && _focusedIndex == i)
                      ? [
                          BoxShadow(
                            color: AppColors.zinc900.withValues(alpha: 0.15),
                            blurRadius: 0,
                            spreadRadius: 2,
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  widget.labels[i],
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: widget.selectedIndex == i
                        ? Colors.white
                        : AppColors.foreground,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
