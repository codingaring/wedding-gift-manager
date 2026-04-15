import 'package:flutter/material.dart';

import '../../core/utils/number_format.dart';
import '../../domain/entities/guest_summary.dart';
import '../../main.dart';

class SummaryCard extends StatelessWidget {
  final GuestSummary summary;

  const SummaryCard({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
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
            '요약',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 16),

          // 합계 (큰 수)
          Text(
            '${formatAmount(summary.totalAmount)}원',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: AppColors.foreground,
              letterSpacing: -0.5,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '총 ${summary.totalCount}건',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 12),

          // 현금 / 계좌이체
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: '현금',
                  amount: '${formatAmount(summary.cashAmount)}원',
                  count: '${summary.cashCount}건',
                ),
              ),
              if (summary.transferCount > 0)
                Expanded(
                  child: _StatItem(
                    label: '계좌이체',
                    amount: '${formatAmount(summary.transferAmount)}원',
                    count: '${summary.transferCount}건',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String amount;
  final String count;

  const _StatItem({
    required this.label,
    required this.amount,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.mutedForeground,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          amount,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.foreground,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
        Text(
          count,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.mutedForeground,
          ),
        ),
      ],
    );
  }
}
