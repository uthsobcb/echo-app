import EntryCard from "@/component/EntryCard";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dailyPrompt } from "./../../constant/const";

import { useStorage } from "@/context/StorageContext";

export default function Home() {
  const { user, stats, entries } = useStorage();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const randomPrompt = dailyPrompt[Math.floor(Math.random() * dailyPrompt.length)];
    setPrompt(randomPrompt);
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#f8fafc' }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View>
            <Text className="text-gray-500 text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text className="text-gray-700 text-lg font-semibold">Good Morning,</Text>
            <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="bg-gray-100 p-2 rounded-full" onPress={() => { router.push('/(chat)') }}>
              <Ionicons name="chatbox" color="#374151" size={24} />
            </TouchableOpacity>
            <Image source={require('../../assets/images/avatar.png')} className="h-14 w-14 rounded-full border-2 border-blue-400" />
          </View>
        </View>
        {/* Daily Prompt Card */}
        <View className="px-4">
          <View className="relative overflow-hidden rounded-3xl bg-slate-100 px-5 py-5">
            <View className="absolute right-0 top-0 h-full w-2/3 bg-emerald-50/40" />
            <View className="absolute -right-14 top-10 h-72 w-72 rounded-full border border-slate-300/30" />
            <View className="absolute -right-24 top-16 h-80 w-80 rounded-full border border-slate-300/25" />
            <View className="absolute -right-36 top-24 h-96 w-96 rounded-full border border-slate-300/20" />

            <View className="relative">
              <View className="self-start rounded-full bg-white/70 px-4 py-2">
                <Text className="text-[13px] font-semibold tracking-widest text-slate-700">
                  DAILY PROMPT
                </Text>
              </View>

              <Text className="mt-4 text-[34px] font-extrabold tracking-tight text-slate-900">
                Ready to unwind?
              </Text>
              <Text className="mt-2 max-w-[320px] text-[18px] leading-6 text-slate-600">
                {prompt}
              </Text>

              <TouchableOpacity
                className="mt-6 self-start flex-row items-center rounded-2xl bg-blue-500 px-6 py-3"
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text className="text-[18px] text-white">✎</Text>
                <Text className="ml-3 text-[18px] font-semibold text-white">
                  Write Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="mx-6 mb-6 mt-8">
          <Text className="text-lg font-bold text-gray-900 mb-4">Your Progress</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-blue-400/10 p-5 rounded-2xl" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
              <AntDesign name="folder-open" color="purple" size={25} />
              <Text className="text-green-600 text-xs font-semibold mb-2">Entries</Text>
              <Text className="text-3xl font-bold text-gray-900">{stats.entries}</Text>
              <Text className="text-gray-500 text-xs mt-2">This month</Text>
            </View>
            <View className="flex-1 bg-blue-400/10 p-5 rounded-2xl" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
              <AntDesign name="fire" color="orange" size={25} />
              <Text className="text-purple-600 text-xs font-semibold mb-2">Streak</Text>
              <Text className="text-3xl font-bold text-gray-900">{stats.streak}</Text>
              <Text className="text-gray-500 text-xs mt-2">Days</Text>
            </View>
            <View className="flex-1 bg-blue-400/10 p-5 rounded-2xl" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
              <AntDesign name="check-circle" color="green" size={25} />
              <Text className="text-blue-600 text-xs font-semibold mb-2">Tasks</Text>
              <Text className="text-3xl font-bold text-gray-900">{stats.tasks}</Text>
              <Text className="text-gray-500 text-xs mt-2">To-Do</Text>
            </View>
          </View>

          <View className="p-4 rounded-2xl bg-blue-50/60 mt-6 border border-blue-400/20" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 3 }}>
            <View className="flex-row items-center gap-4">
              <Image source={require('../../assets/images/frustated-echo.webp')} className="h-14 w-14 rounded-md" accessibilityLabel="Echo avatar" />
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-lg font-semibold">Echo Says...</Text>
                  <View className="px-2 py-1 rounded-full bg-blue-100 border border-blue-200">
                    <Text className="text-sm text-blue-700">Mood: {user.mood}</Text>
                  </View>
                </View>

                <Text className="text-gray-500 text-sm mt-1 max-w-[260px]">
                  It seems you've been feeling a bit low this week. Would you like to talk Echo, or try a quick breathing exercise?
                </Text>

                <View className="mt-4 flex-row items-center gap-3">
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Talk to Echo"
                    className="flex-row items-center rounded-xl bg-blue-500 px-4 py-2"
                    onPress={() => router.push('/(chat)')}
                  >
                    <Text className="text-white text-lg">✋</Text>
                    <Text className="ml-3 text-white font-semibold">Talk</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Try a breathing exercise"
                    className="flex-row items-center rounded-xl bg-white px-4 py-2 border border-blue-200"
                    onPress={() => router.push('/(meditation)')}
                  >
                    <Text className="text-blue-600 text-lg">🧘</Text>
                    <Text className="ml-3 text-blue-600 font-semibold">Breathe</Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-3">
                  <Text className="text-xs text-gray-500 mb-1">Mood score</Text>
                  <View className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                    <View className="h-2 rounded-full" style={{ width: '10%', backgroundColor: '#60A5FA' }} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8 ">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-900 text-lg font-bold">
                Last Entry
              </Text>

              <TouchableOpacity onPress={() => router.push("/(tabs)/journal")}>
                <Text className="text-blue-600 font-semibold text-sm">
                  All Entries →
                </Text>
              </TouchableOpacity>
            </View>

            <EntryCard entry={entries[0]} />

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
