// PIN 입력 다이얼로그 — shadcn/ui 스타일

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';
import '../../main.dart';

/// PIN 입력 다이얼로그. 입력된 PIN 문자열을 반환하거나, 취소 시 null.
Future<String?> showPinDialog(BuildContext context) {
  return showDialog<String>(
    context: context,
    builder: (context) => const _PinDialog(),
  );
}

class _PinDialog extends StatefulWidget {
  const _PinDialog();

  @override
  State<_PinDialog> createState() => _PinDialogState();
}

class _PinDialogState extends State<_PinDialog> {
  final _controller = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 340),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'PIN 입력',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                '삭제를 위해 PIN을 입력해주세요',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.number,
                obscureText: true,
                maxLength: pinLength,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                autofocus: true,
                decoration: InputDecoration(
                  hintText: '$pinLength자리 숫자',
                  counterText: '',
                  errorText: _error,
                ),
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 40,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('취소'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 40,
                      child: FilledButton(
                        onPressed: _submit,
                        child: const Text('확인'),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit() {
    final pin = _controller.text;
    if (pin.length != pinLength) {
      setState(() => _error = '$pinLength자리를 입력하세요');
      return;
    }
    Navigator.pop(context, pin);
  }
}
