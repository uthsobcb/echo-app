import EntryCard from '@/component/EntryCard';
import Filter from '@/component/Filter';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStorage } from '@/context/StorageContext';
import { FlatList } from 'react-native';

export default function Journal() {
    const { user, entries } = useStorage();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4 bg-white border-b border-gray-100">
                <View>
                    <Text className="text-gray-500 text-base font-medium mb-1">Good Morning,</Text>
                    <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">{user.name}</Text>
                </View>

                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        className="bg-gray-50 p-2.5 rounded-full border border-gray-100 shadow-sm"
                        onPress={() => { router.push('/(chat)') }}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" color="#374151" size={22} />
                    </TouchableOpacity>
                    <View className="p-0.5 bg-white rounded-full border border-gray-200 shadow-sm">
                        <Image source={require('../../assets/images/avatar.png')} className="h-12 w-12 rounded-full" />
                    </View>
                </View>
            </View>
            <Filter />

            <FlatList
                data={entries}
                keyExtractor={(item) => item.id || item._id || Math.random().toString()}
                renderItem={({ item }) => (
                    <View className="px-4 mb-3">
                        <EntryCard entry={item} />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                ListEmptyComponent={() => (
                    <View className="px-4 mt-6">
                        <Text className="text-center text-gray-500">No entries yet. Start your journey!</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}