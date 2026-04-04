import "../global.css";

import { StorageProvider } from "@/context/StorageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { scheduleDailyReminder, setupNotifications } from "@/service/NotificationService";
import {
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
  useFonts,
} from "@expo-google-fonts/caveat";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      const isGranted = await setupNotifications();
      if (isGranted) {
        await scheduleDailyReminder();
      }
    };
    initNotifications();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <StorageProvider>
        <Slot />
      </StorageProvider>
    </ThemeProvider>
  );
}
