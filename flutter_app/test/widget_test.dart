import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:wedding_gift_manager/main.dart';

void main() {
  testWidgets('App launches and shows setup screen', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: WeddingGiftApp()));
    await tester.pumpAndSettle();
    // Setup 화면이 표시되어야 함
    expect(find.text('Wedding Gift Manager'), findsOneWidget);
    expect(find.text('결혼식 축의금 수납 앱'), findsOneWidget);
  });
}
