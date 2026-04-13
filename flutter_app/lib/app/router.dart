// 앱 라우팅: Setup(최초 1회) → GuestList(메인 화면)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/entities/app_config.dart';
import '../presentation/providers/providers.dart';
import '../presentation/screens/guest_list_screen.dart';
import '../presentation/screens/setup_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const _AppShell(),
      ),
    ],
  );
});

class _AppShell extends ConsumerStatefulWidget {
  const _AppShell();

  @override
  ConsumerState<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<_AppShell> {
  AppConfig? _config;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final configRepo = ref.read(configRepositoryProvider);
    final config = await configRepo.getConfig();
    setState(() {
      _config = config;
      _loading = false;
    });

    if (config != null && config.isSetupComplete) {
      ref.read(backupServiceProvider).start();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_config == null || !_config!.isSetupComplete) {
      return SetupScreen(onSetupComplete: () => _loadConfig());
    }

    return GuestListScreen(deviceId: _config!.deviceId);
  }
}
