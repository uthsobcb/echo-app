import EntryCard from '@/component/EntryCard';
import Filter from '@/component/Filter';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Journal() {
    return (
        <SafeAreaView>
            <View className="flex-row items-center justify-between px-6 py-4">
                <View>
                    <Text className="text-gray-700 text-lg font-semibold">Good Morning,</Text>
                    <Text className="text-2xl font-bold text-gray-900">Uthsob</Text>
                </View>

                <View className="flex-row items-center gap-3">
                    <TouchableOpacity className="bg-gray-100 p-2 rounded-full" onPress={() => { router.push('/(chat)') }}>
                        <Ionicons name="chatbox" color="#374151" size={24} />
                    </TouchableOpacity>
                    <Image source={require('../../assets/images/avatar.png')} className="h-14 w-14 rounded-full border-2 border-blue-400" />
                </View>
            </View>
            <Filter />
            {/* Using FlatList */}
            <EntryCard />
        </SafeAreaView>
    );
}