import { useStorage } from "@/context/StorageContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, onboardingComplete } = useStorage();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B9BF8" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={onboardingComplete ? '/(auth)/signin' : '/(onboarding)'} />;
  }

  return <Redirect href="/(tabs)" />;
}
