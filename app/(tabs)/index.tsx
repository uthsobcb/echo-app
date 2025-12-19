import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center bg-red-400">
        <Text className="text-xl font-bold text-red-700">
          Welcome back!
        </Text>
      </View>
    </SafeAreaView>
  );
}
