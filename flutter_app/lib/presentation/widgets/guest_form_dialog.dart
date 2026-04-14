// 수납 추가/수정 공용 모달 — Flutter 앱에서는 항상 현금 (paymentMethod 숨김)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';
import '../../core/utils/number_format.dart';
import '../../domain/entities/guest.dart';

/// 추가 모달
Future<Map<String, dynamic>?> showAddGuestDialog(BuildContext context) {
  return showDialog<Map<String, dynamic>>(
    context: context,
    barrierDismissible: false,
    builder: (context) => const _GuestFormDialog(),
  );
}

/// 수정 모달
Future<Guest?> showEditGuestDialog(BuildContext context, Guest guest) {
  return showDialog<Guest>(
    context: context,
    barrierDismissible: false,
    builder: (context) => _GuestFormDialog(guest: guest),
  );
}

class _GuestFormDialog extends StatefulWidget {
  final Guest? guest;
  const _GuestFormDialog({this.guest});

  bool get isEditing => guest != null;

  @override
  State<_GuestFormDialog> createState() => _GuestFormDialogState();
}

class _GuestFormDialogState extends State<_GuestFormDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _amountController;
  late final TextEditingController _memoController;
  late final TextEditingController _customRelationController;
  late final TextEditingController _mealTicketsController;
  GuestRelation? _selectedRelation;
  int _mealTickets = 0;
  final _formKey = GlobalKey<FormState>();
  final _nameFocus = FocusNode();

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
      // 기타인 경우 또는 매칭 안 되는 경우 → 기타 + 직접 입력
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 헤더
                Row(
                  children: [
                    Icon(
                      widget.isEditing ? Icons.edit : Icons.person_add,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.isEditing ? '수납 수정' : '수납 추가',
                      style: theme.textTheme.titleLarge,
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(height: 24),

                // 이름
                TextFormField(
                  controller: _nameController,
                  focusNode: _nameFocus,
                  decoration: const InputDecoration(
                    labelText: '이름 *',
                    border: OutlineInputBorder(),
                    isDense: true,
                    prefixIcon: Icon(Icons.person_outline, size: 20),
                  ),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? '이름을 입력하세요' : null,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                // 금액 빠른 입력 버튼
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final amt in [3, 5, 10, 15, 20, 25, 30])
                      _AmountChip(
                        amount: amt * 10000,
                        isSelected:
                            parseAmount(_amountController.text) == amt * 10000,
                        onTap: () {
                          _amountController.text = formatAmount(amt * 10000);
                          setState(() {});
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                // 금액 직접 입력
                TextFormField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    labelText: '금액 (직접 입력)',
                    border: OutlineInputBorder(),
                    isDense: true,
                    suffixText: '원',
                    prefixIcon: Icon(Icons.payments_outlined, size: 20),
                  ),
                  onChanged: (_) {
                    _formatField(_amountController);
                    setState(() {});
                  },
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                // 관계
                DropdownButtonFormField<GuestRelation>(
                  initialValue: _selectedRelation,
                  decoration: const InputDecoration(
                    labelText: '관계',
                    border: OutlineInputBorder(),
                    isDense: true,
                    prefixIcon: Icon(Icons.group_outlined, size: 20),
                  ),
                  isExpanded: true,
                  items: GuestRelation.values
                      .map((r) =>
                          DropdownMenuItem(value: r, child: Text(r.label)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedRelation = v),
                ),

                // 기타 선택 시 직접 입력
                if (_selectedRelation == GuestRelation.other) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _customRelationController,
                    decoration: const InputDecoration(
                      labelText: '관계 직접 입력',
                      border: OutlineInputBorder(),
                      isDense: true,
                      hintText: '예: 대학 선배, 이웃 등',
                    ),
                  ),
                ],
                const SizedBox(height: 16),

                // 식권
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final n in [0, 1, 2, 3, 4, 5])
                      _MealTicketChip(
                        count: n,
                        isSelected: _mealTickets == n,
                        onTap: () {
                          setState(() => _mealTickets = n);
                          _mealTicketsController.text = n.toString();
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _mealTicketsController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    labelText: '식권 수령 (직접 입력)',
                    border: OutlineInputBorder(),
                    isDense: true,
                    suffixText: '장',
                    prefixIcon: Icon(Icons.restaurant_outlined, size: 20),
                  ),
                  onChanged: (v) {
                    final parsed = int.tryParse(v) ?? 0;
                    setState(() => _mealTickets = parsed);
                  },
                ),
                const SizedBox(height: 16),

                // 메모
                TextFormField(
                  controller: _memoController,
                  decoration: const InputDecoration(
                    labelText: '메모 (선택)',
                    border: OutlineInputBorder(),
                    isDense: true,
                    prefixIcon: Icon(Icons.note_outlined, size: 20),
                  ),
                  onFieldSubmitted: (_) => _onSave(),
                ),
                const SizedBox(height: 24),

                // 버튼
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('취소'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: _onSave,
                      icon: Icon(widget.isEditing ? Icons.check : Icons.add),
                      label: Text(widget.isEditing ? '수정' : '추가'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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

class _AmountChip extends StatelessWidget {
  final int amount;
  final bool isSelected;
  final VoidCallback onTap;

  const _AmountChip({
    required this.amount,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final label = '${amount ~/ 10000}만원';
    return Material(
      color: isSelected ? const Color(0xFF2C2C2C) : const Color(0xFFF5F5F5),
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : const Color(0xFF444444),
            ),
          ),
        ),
      ),
    );
  }
}

class _MealTicketChip extends StatelessWidget {
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  const _MealTicketChip({
    required this.count,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final label = count == 0 ? 'X' : '$count장';
    return Material(
      color: isSelected ? const Color(0xFF2C2C2C) : const Color(0xFFF5F5F5),
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : const Color(0xFF444444),
            ),
          ),
        ),
      ),
    );
  }
}
