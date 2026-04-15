import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(
    const ProviderScope(
      child: WeddingGiftApp(),
    ),
  );
}

// shadcn/ui zinc palette
class AppColors {
  AppColors._();

  static const zinc50 = Color(0xFFFAFAFA);
  static const zinc100 = Color(0xFFF4F4F5);
  static const zinc200 = Color(0xFFE4E4E7);
  static const zinc300 = Color(0xFFD4D4D8);
  static const zinc400 = Color(0xFFA1A1AA);
  static const zinc500 = Color(0xFF71717A);
  static const zinc600 = Color(0xFF52525B);
  static const zinc700 = Color(0xFF3F3F46);
  static const zinc800 = Color(0xFF27272A);
  static const zinc900 = Color(0xFF18181B);
  static const zinc950 = Color(0xFF09090B);

  static const background = Colors.white;
  static const foreground = zinc950;
  static const card = Colors.white;
  static const cardForeground = zinc950;
  static const primary = zinc900;
  static const primaryForeground = zinc50;
  static const secondary = zinc100;
  static const secondaryForeground = zinc900;
  static const muted = zinc100;
  static const mutedForeground = zinc500;
  static const border = zinc200;
  static const input = zinc200;
  static const ring = zinc950;
  static const destructive = Color(0xFFEF4444);
  static const destructiveForeground = zinc50;
}

class WeddingGiftApp extends ConsumerWidget {
  const WeddingGiftApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Wedding Gift Manager',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.light(
          surface: AppColors.background,
          onSurface: AppColors.foreground,
          primary: AppColors.primary,
          onPrimary: AppColors.primaryForeground,
          primaryContainer: AppColors.secondary,
          onPrimaryContainer: AppColors.secondaryForeground,
          secondary: AppColors.secondary,
          onSecondary: AppColors.secondaryForeground,
          secondaryContainer: AppColors.muted,
          onSecondaryContainer: AppColors.mutedForeground,
          surfaceContainerHighest: AppColors.zinc100,
          surfaceContainerLowest: AppColors.zinc50,
          outline: AppColors.zinc300,
          outlineVariant: AppColors.border,
          error: AppColors.destructive,
          onError: AppColors.destructiveForeground,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        fontFamily: 'Pretendard',
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.foreground,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: AppColors.foreground,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.card,
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.border),
          ),
        ),
        dividerTheme: const DividerThemeData(
          color: AppColors.border,
          thickness: 1,
          space: 1,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.background,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.input),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.input),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.ring, width: 1),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.destructive),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          hintStyle: const TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 14,
          ),
          labelStyle: const TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 14,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.1,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.foreground,
            side: const BorderSide(color: AppColors.input),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              letterSpacing: -0.1,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.foreground,
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        floatingActionButtonTheme: FloatingActionButtonThemeData(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          elevation: 0,
          highlightElevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.zinc900,
          contentTextStyle: const TextStyle(
            color: AppColors.zinc50,
            fontSize: 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          behavior: SnackBarBehavior.floating,
          elevation: 0,
        ),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.secondary,
          side: BorderSide.none,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
          ),
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        dialogTheme: DialogThemeData(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.foreground,
            letterSpacing: -0.5,
          ),
          titleLarge: TextStyle(
            fontWeight: FontWeight.w600,
            color: AppColors.foreground,
            fontSize: 18,
            letterSpacing: -0.3,
          ),
          titleMedium: TextStyle(
            fontWeight: FontWeight.w500,
            color: AppColors.foreground,
            fontSize: 16,
            letterSpacing: -0.2,
          ),
          bodyLarge: TextStyle(
            color: AppColors.foreground,
            fontSize: 16,
            letterSpacing: -0.1,
          ),
          bodyMedium: TextStyle(
            color: AppColors.foreground,
            fontSize: 14,
            letterSpacing: -0.1,
          ),
          bodySmall: TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 12,
            letterSpacing: 0,
          ),
          labelLarge: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
            letterSpacing: -0.1,
          ),
          labelMedium: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 12,
            letterSpacing: 0,
          ),
        ),
        tabBarTheme: const TabBarThemeData(
          labelColor: AppColors.foreground,
          unselectedLabelColor: AppColors.mutedForeground,
          indicatorColor: AppColors.foreground,
          dividerColor: AppColors.border,
          labelStyle: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          unselectedLabelStyle: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
        ),
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
        ),
      ),
      routerConfig: router,
    );
  }
}
