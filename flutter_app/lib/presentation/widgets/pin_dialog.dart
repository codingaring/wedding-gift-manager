// PIN 입력 다이얼로그 (삭제 시 사용)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';

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
    return AlertDialog(
      title: const Text('PIN 입력'),
      content: TextField(
        controller: _controller,
        keyboardType: TextInputType.number,
        obscureText: true,
        maxLength: pinLength,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: InputDecoration(
          labelText: 'PIN ($pinLength자리)',
          errorText: _error,
        ),
        autofocus: true,
        onSubmitted: (_) => _submit(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('취소'),
        ),
        FilledButton(onPressed: _submit, child: const Text('확인')),
      ],
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
