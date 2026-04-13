import 'package:flutter/material.dart';

import '../../core/utils/number_format.dart';
import '../../domain/entities/guest_summary.dart';

class SummaryCard extends StatelessWidget {
  final GuestSummary summary;

  const SummaryCard({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            _Stat(
              label: '총 건수',
              value: '${summary.totalCount}건',
              color: theme.colorScheme.onSurface,
            ),
            _divider(theme),
            _Stat(
              label: '현금',
              value: '${formatAmount(summary.cashAmount)}원',
              sub: '${summary.cashCount}건',
              color: theme.colorScheme.primary,
            ),
            if (summary.transferCount > 0) ...[
              _divider(theme),
              _Stat(
                label: '계좌이체',
                value: '${formatAmount(summary.transferAmount)}원',
                sub: '${summary.transferCount}건',
                color: theme.colorScheme.tertiary,
              ),
            ],
            _divider(theme),
            _Stat(
              label: '합계',
              value: '${formatAmount(summary.totalAmount)}원',
              color: theme.colorScheme.primary,
              isBold: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _divider(ThemeData theme) {
    return Container(
      width: 1,
      height: 36,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: theme.colorScheme.outlineVariant,
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final String? sub;
  final Color color;
  final bool isBold;

  const _Stat({
    required this.label,
    required this.value,
    this.sub,
    required this.color,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              color: color,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            ),
          ),
          if (sub != null)
            Text(
              sub!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
        ],
      ),
    );
  }
}
