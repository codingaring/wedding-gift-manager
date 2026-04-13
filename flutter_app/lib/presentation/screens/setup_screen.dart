// 최초 실행 설정 (신랑/신부 선택 + PIN)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../notifiers/setup_notifier.dart';

class SetupScreen extends ConsumerStatefulWidget {
  final VoidCallback onSetupComplete;

  const SetupScreen({super.key, required this.onSetupComplete});

  @override
  ConsumerState<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends ConsumerState<SetupScreen> {
  final _pinController = TextEditingController();
  final _pinConfirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _pinController.dispose();
    _pinConfirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(setupNotifierProvider);
    final notifier = ref.read(setupNotifierProvider.notifier);
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Wedding Gift Manager',
                    style: theme.textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '결혼식 축의금 수납 앱',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 48),

                  // 신랑/신부 선택
                  Text('수납 측을 선택하세요', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _SideButton(
                          side: DeviceSide.groom,
                          icon: Icons.person,
                          isSelected: state.selectedSide == DeviceSide.groom,
                          onTap: () => notifier.selectSide(DeviceSide.groom),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _SideButton(
                          side: DeviceSide.bride,
                          icon: Icons.person_outline,
                          isSelected: state.selectedSide == DeviceSide.bride,
                          onTap: () => notifier.selectSide(DeviceSide.bride),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // PIN 설정
                  TextFormField(
                    controller: _pinController,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: pinLength,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'PIN 설정',
                      helperText: '삭제 시 사용할 $pinLength자리 숫자',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if (v == null || v.length != pinLength) {
                        return '$pinLength자리를 입력하세요';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _pinConfirmController,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: pinLength,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'PIN 확인',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if (v != _pinController.text) {
                        return 'PIN이 일치하지 않습니다';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),

                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        state.error!,
                        style: TextStyle(color: theme.colorScheme.error),
                      ),
                    ),

                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed: state.isLoading ? null : _onComplete,
                      child: state.isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('설정 완료'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _onComplete() async {
    if (!_formKey.currentState!.validate()) return;

    final notifier = ref.read(setupNotifierProvider.notifier);
    final success = await notifier.completeSetup(_pinController.text);
    if (success && mounted) {
      widget.onSetupComplete();
    }
  }
}

class _SideButton extends StatelessWidget {
  final DeviceSide side;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _SideButton({
    required this.side,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: isSelected ? const Color(0xFFF5F5F5) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF2C2C2C)
                  : const Color(0xFFE0E0E0),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 48,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 8),
              Text(
                '${side.label} 측',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
