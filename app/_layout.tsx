import "../global.css";

import { StorageProvider } from "@/context/StorageContext";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <StorageProvider>
      <Slot />
    </StorageProvider>
  );
}
