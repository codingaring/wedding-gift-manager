// 설정 상태 관리

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../domain/entities/app_config.dart';
import '../../presentation/providers/providers.dart';

class SetupState {
  final DeviceSide? selectedSide;
  final bool isLoading;
  final String? error;

  const SetupState({this.selectedSide, this.isLoading = false, this.error});

  SetupState copyWith({
    DeviceSide? selectedSide,
    bool? isLoading,
    String? error,
  }) {
    return SetupState(
      selectedSide: selectedSide ?? this.selectedSide,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class SetupNotifier extends StateNotifier<SetupState> {
  final Ref _ref;

  SetupNotifier(this._ref) : super(const SetupState());

  void selectSide(DeviceSide side) {
    state = state.copyWith(selectedSide: side, error: null);
  }

  Future<bool> completeSetup(String pin) async {
    final side = state.selectedSide;
    if (side == null) {
      state = state.copyWith(error: '신랑 측 또는 신부 측을 선택하세요');
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final repo = _ref.read(configRepositoryProvider);
      await repo.saveConfig(
        AppConfig(deviceId: side.id, pin: pin, isSetupComplete: true),
      );
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '설정 저장 실패: $e');
      return false;
    }
  }
}

final setupNotifierProvider = StateNotifierProvider<SetupNotifier, SetupState>((
  ref,
) {
  return SetupNotifier(ref);
});
