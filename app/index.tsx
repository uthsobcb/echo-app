import { Redirect } from "expo-router";

export default function Index() {
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signin" />;
  }

  return <Redirect href="/(tabs)" />;
}
