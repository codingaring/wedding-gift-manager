// AppConfig 엔티티 정의

class AppConfig {
  final String deviceId;
  final String pin;
  final bool isSetupComplete;

  const AppConfig({
    required this.deviceId,
    required this.pin,
    this.isSetupComplete = false,
  });
}
