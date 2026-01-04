import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native'

interface SettingsModalProps {
    isVisible: boolean
    onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isVisible,
    onClose,
}) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [notifications, setNotifications] = useState(true)

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50">
                <View className="mt-auto flex flex-col rounded-t-3xl bg-white">
                    {/* Header */}
                    <View className="border-b border-slate-200 px-6 py-4">
                        <View className="flex flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-slate-900">
                                Settings
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="rounded-full p-2"
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Settings Content */}
                    <ScrollView className="max-h-96 px-6 py-4">
                        {/* Theme Setting */}
                        <View className="mb-6">
                            <Text className="mb-3 text-sm font-semibold text-slate-900">
                                Theme
                            </Text>
                            <View className="flex flex-row gap-3">
            <TouchableOpacity
                                    onPress={() => setTheme('light')}
                                    className={`flex-1 flex-row items-center gap-2 rounded-lg border-2 px-4 py-3 ${
                                        theme === 'light'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <MaterialCommunityIcons
                                        name="white-balance-sunny"
                                        size={18}
                                        color={
                                            theme === 'light'
                                                ? '#3b82f6'
                                                : '#94a3b8'
                                        }
                                    />
                                    <Text
                                        className={`text-sm font-medium ${
                                            theme === 'light'
                                                ? 'text-blue-600'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        Light
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setTheme('dark')}
                                    className={`flex-1 flex-row items-center gap-2 rounded-lg border-2 px-4 py-3 ${
                                        theme === 'dark'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <MaterialCommunityIcons
                                        name="moon-waning-crescent"
                                        size={18}
                                        color={
                                            theme === 'dark'
                                                ? '#3b82f6'
                                                : '#94a3b8'
                                        }
                                    />
                                    <Text
                                        className={`text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'text-blue-600'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        Dark
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Notifications Setting */}
                        <View className="border-b border-slate-200 pb-6">
                            <View className="flex flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-slate-900">
                                        Notifications
                                    </Text>
                                    <Text className="mt-1 text-xs text-slate-500">
                                        Receive message notifications
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() =>
                                        setNotifications(!notifications)
                                    }
                                    className={`rounded-full px-3 py-1 ${
                                        notifications
                                            ? 'bg-blue-500'
                                            : 'bg-slate-300'
                                    }`}
                                >
                                    <View
                                        className={`h-6 w-6 rounded-full bg-white ${
                                            notifications
                                                ? 'translate-x-0'
                                                : 'translate-x-2'
                                        }`}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* About Section */}
                        <View className="mt-6">
                            <Text className="mb-3 text-sm font-semibold text-slate-900">
                                About
                            </Text>
                            <View className="rounded-lg bg-slate-50 px-4 py-3">
                                <View className="mb-3 flex flex-row items-center justify-between">
                                    <Text className="text-xs text-slate-600">
                                        App Version
                                    </Text>
                                    <Text className="text-xs font-semibold text-slate-900">
                                        1.0.0
                                    </Text>
                                </View>
                                <View className="flex flex-row items-center justify-between">
                                    <Text className="text-xs text-slate-600">
                                        Build
                                    </Text>
                                    <Text className="text-xs font-semibold text-slate-900">
                                        001
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Close Button */}
                    <View className="border-t border-slate-200 px-6 py-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="rounded-lg bg-slate-100 py-3"
                        >
                            <Text className="text-center font-semibold text-slate-900">
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
