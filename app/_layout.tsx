import "../global.css";

import ErrorBoundary from "@/component/ErrorBoundary";
import CelebrationOverlay from "@/component/gamification/CelebrationOverlay";
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
        // Check if reminders are enabled (default to true if not set)
        const reminderEnabled = await AsyncStorage.getItem('echo_reminder_enabled');
        const isEnabled = reminderEnabled === null || reminderEnabled === 'true';
        
        if (isEnabled) {
          const isGranted = await setupNotifications();
          if (isGranted) {
            await scheduleDailyReminder();
          }
        }
      } catch (error) {
        // If there's an error, try to setup notifications anyway
        const isGranted = await setupNotifications();
        if (isGranted) {
          await scheduleDailyReminder();
        }
      }
    };
    initNotifications();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StorageProvider>
          <GamificationProvider>
            <Slot />
            <CelebrationOverlay />
          </GamificationProvider>
        </StorageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default codePush({
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
})(RootLayout);
