// 최초 실행 설정 (신랑/신부 선택 + PIN)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../main.dart';
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
  bool _obscurePin = true;
  bool _obscurePinConfirm = true;

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

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 로고 영역
                    Center(
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.zinc900,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.card_giftcard_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Center(
                      child: Text(
                        '축의금 수납',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppColors.foreground,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Center(
                      child: Text(
                        '시작하기 전에 간단한 설정이 필요해요',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),

                    // 측 선택
                    const Text(
                      '수납 측',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _SideOption(
                            side: DeviceSide.groom,
                            isSelected: state.selectedSide == DeviceSide.groom,
                            onTap: () => notifier.selectSide(DeviceSide.groom),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _SideOption(
                            side: DeviceSide.bride,
                            isSelected: state.selectedSide == DeviceSide.bride,
                            onTap: () => notifier.selectSide(DeviceSide.bride),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // PIN 설정
                    const Text(
                      'PIN 설정',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '삭제 시 본인 확인에 사용됩니다',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.mutedForeground,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      obscureText: _obscurePin,
                      maxLength: pinLength,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        hintText: '$pinLength자리 숫자',
                        counterText: '',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePin
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 20,
                            color: AppColors.mutedForeground,
                          ),
                          onPressed: () =>
                              setState(() => _obscurePin = !_obscurePin),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.length != pinLength) {
                          return '$pinLength자리를 입력하세요';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _pinConfirmController,
                      keyboardType: TextInputType.number,
                      obscureText: _obscurePinConfirm,
                      maxLength: pinLength,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        hintText: 'PIN 확인',
                        counterText: '',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePinConfirm
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 20,
                            color: AppColors.mutedForeground,
                          ),
                          onPressed: () => setState(
                              () => _obscurePinConfirm = !_obscurePinConfirm),
                        ),
                      ),
                      validator: (v) {
                        if (v != _pinController.text) {
                          return 'PIN이 일치하지 않습니다';
                        }
                        return null;
                      },
                    ),

                    if (state.error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.destructive.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color:
                                AppColors.destructive.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Text(
                          state.error!,
                          style: const TextStyle(
                            color: AppColors.destructive,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
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
                            : const Text('시작하기'),
                      ),
                    ),
                  ],
                ),
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

class _SideOption extends StatelessWidget {
  final DeviceSide side;
  final bool isSelected;
  final VoidCallback onTap;

  const _SideOption({
    required this.side,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.zinc900 : AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.zinc900 : AppColors.border,
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              side == DeviceSide.groom
                  ? Icons.face_rounded
                  : Icons.face_3_rounded,
              size: 32,
              color: isSelected ? Colors.white : AppColors.zinc500,
            ),
            const SizedBox(height: 8),
            Text(
              '${side.label} 측',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
