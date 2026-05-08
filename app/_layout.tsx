import "../global.css";

import ErrorBoundary from "@/component/ErrorBoundary";
import CelebrationOverlay from "@/component/gamification/CelebrationOverlay";
import { ToastContainer } from "@/component/Toast";
import { GamificationProvider } from "@/context/GamificationContext";
import { StorageProvider } from "@/context/StorageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { scheduleDailyReminder, setupNotifications } from "@/service/NotificationService";
import {
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
  useFonts,
} from "@expo-google-fonts/caveat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

import codePush from "@revopush/react-native-code-push";

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const reminderEnabled = await AsyncStorage.getItem('echo_reminder_enabled');
        // Default to enabled if preference not yet set
        const isEnabled = reminderEnabled === null || reminderEnabled === 'true';
        if (!isEnabled) return;

        const isGranted = await setupNotifications();
        if (isGranted) {
          await scheduleDailyReminder();
        }
      } catch (error) {
        // Silently fail — notifications are non-critical
      }
    };
    initNotifications();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <StorageProvider>
            <GamificationProvider>
              <Slot />
              <CelebrationOverlay />
              <ToastContainer />
            </GamificationProvider>
          </StorageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default codePush({
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
})(RootLayout);
