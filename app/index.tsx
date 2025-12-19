import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView>
      <View className="flex-1 items-center justify-center bg-red-400">
        <Text className="text-xl font-bold text-red-700">
          Welcome to Nativewind!
        </Text>
      </View>
    </SafeAreaView>
  );
}
