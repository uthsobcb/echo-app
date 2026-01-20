import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, rightElement, onPress, showArrow = true }: SettingItemProps) {
    return (
        <TouchableOpacity
            className="flex-row items-center py-4 px-4 bg-white rounded-2xl mb-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-4">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">{title}</Text>
                {subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
            </View>
            {rightElement}
            {showArrow && !rightElement && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
        </TouchableOpacity>
    );
}

export default function Profile() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [reminderEnabled, setReminderEnabled] = useState(true);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header */}
                <View className="px-6 py-4">
                    <Text className="text-2xl font-bold text-gray-900">Profile</Text>
                </View>

                {/* Profile Card */}
                <View className="mx-4 mb-6">
                    <View
                        className="bg-white rounded-3xl p-6 items-center"
                        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}
                    >
                        <View className="relative">
                            <Image
                                source={require('../../assets/images/avatar.png')}
                                className="h-24 w-24 rounded-full border-4 border-blue-100"
                            />
                            <TouchableOpacity
                                className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                                style={{ shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}
                            >
                                <Feather name="camera" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mt-4">Uthsob</Text>
                        <Text className="text-gray-500 text-sm mt-1">uthsob@example.com</Text>
                        <View className="flex-row items-center mt-2">
                            <View className="bg-emerald-100 px-3 py-1 rounded-full">
                                <Text className="text-emerald-600 text-xs font-semibold">Pro Member</Text>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View className="flex-row mt-6 pt-6 border-t border-gray-100 w-full">
                            <View className="flex-1 items-center">
                                <Text className="text-2xl font-bold text-gray-900">47</Text>
                                <Text className="text-gray-500 text-xs mt-1">Entries</Text>
                            </View>
                            <View className="w-px bg-gray-200" />
                            <View className="flex-1 items-center">
                                <Text className="text-2xl font-bold text-gray-900">12</Text>
                                <Text className="text-gray-500 text-xs mt-1">Day Streak</Text>
                            </View>
                            <View className="w-px bg-gray-200" />
                            <View className="flex-1 items-center">
                                <Text className="text-2xl font-bold text-gray-900">3</Text>
                                <Text className="text-gray-500 text-xs mt-1">Months</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Account Section */}
                <View className="px-4 mb-6">
                    <Text className="text-gray-500 text-sm font-semibold mb-3 ml-2">ACCOUNT</Text>
                    <SettingItem
                        icon={<Ionicons name="person-outline" size={20} color="#3b82f6" />}
                        title="Edit Profile"
                        subtitle="Update your personal information"
                    />
                    <SettingItem
                        icon={<Ionicons name="shield-checkmark-outline" size={20} color="#3b82f6" />}
                        title="Privacy & Security"
                        subtitle="Manage your data and privacy"
                    />
                    <SettingItem
                        icon={<Ionicons name="card-outline" size={20} color="#3b82f6" />}
                        title="Subscription"
                        subtitle="Pro Plan • Renews Jan 2027"
                    />
                </View>

                {/* Preferences Section */}
                <View className="px-4 mb-6">
                    <Text className="text-gray-500 text-sm font-semibold mb-3 ml-2">PREFERENCES</Text>
                    <SettingItem
                        icon={<Ionicons name="notifications-outline" size={20} color="#3b82f6" />}
                        title="Notifications"
                        subtitle="Push notifications"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                                thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
                            />
                        }
                    />
                    <SettingItem
                        icon={<MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#3b82f6" />}
                        title="Dark Mode"
                        subtitle="Switch to dark theme"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={setDarkModeEnabled}
                                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                                thumbColor={darkModeEnabled ? '#3B82F6' : '#9CA3AF'}
                            />
                        }
                    />
                    <SettingItem
                        icon={<Ionicons name="alarm-outline" size={20} color="#3b82f6" />}
                        title="Daily Reminder"
                        subtitle="Get reminded to journal"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={reminderEnabled}
                                onValueChange={setReminderEnabled}
                                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                                thumbColor={reminderEnabled ? '#3B82F6' : '#9CA3AF'}
                            />
                        }
                    />
                </View>

                {/* Support Section */}
                <View className="px-4 mb-6">
                    <Text className="text-gray-500 text-sm font-semibold mb-3 ml-2">SUPPORT</Text>
                    <SettingItem
                        icon={<Ionicons name="help-circle-outline" size={20} color="#3b82f6" />}
                        title="Help Center"
                        subtitle="FAQs and support"
                    />
                    <SettingItem
                        icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color="#3b82f6" />}
                        title="Contact Us"
                        subtitle="Get in touch with our team"
                    />
                    <SettingItem
                        icon={<Ionicons name="star-outline" size={20} color="#3b82f6" />}
                        title="Rate the App"
                        subtitle="Share your feedback"
                    />
                </View>

                {/* About Section */}
                <View className="px-4 mb-6">
                    <Text className="text-gray-500 text-sm font-semibold mb-3 ml-2">ABOUT</Text>
                    <SettingItem
                        icon={<Ionicons name="document-text-outline" size={20} color="#3b82f6" />}
                        title="Terms of Service"
                    />
                    <SettingItem
                        icon={<Ionicons name="lock-closed-outline" size={20} color="#3b82f6" />}
                        title="Privacy Policy"
                    />
                    <SettingItem
                        icon={<Ionicons name="information-circle-outline" size={20} color="#3b82f6" />}
                        title="App Version"
                        subtitle="1.0.0"
                        showArrow={false}
                    />
                </View>

                {/* Logout Button */}
                <View className="px-4 mb-10">
                    <TouchableOpacity
                        className="flex-row items-center justify-center py-4 bg-red-50 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text className="text-red-500 font-semibold text-base ml-2">Log Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View className="items-center pb-8">
                    <Text className="text-gray-400 text-xs">Made with 💙 by Echo Team</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}