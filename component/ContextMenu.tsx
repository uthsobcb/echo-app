import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
} from 'react-native'

interface ContextMenuOption {
    id: string
    label: string
    icon: string
    color: string
    onPress: () => void
}

interface ContextMenuProps {
    isVisible: boolean
    options: ContextMenuOption[]
    onClose: () => void
    position?: { top: number; left: number }
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    isVisible,
    options,
    onClose,
    position,
}) => {
    if (!isVisible) return null

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                className="flex-1"
                activeOpacity={1}
                onPress={onClose}
            >
                <View className="absolute top-20 left-4 rounded-lg border border-slate-200 bg-white shadow-lg">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => {
                                option.onPress()
                                onClose()
                            }}
                            className="flex flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 active:bg-slate-50"
                        >
                            <MaterialCommunityIcons
                                name={option.icon as any}
                                size={18}
                                color={option.color}
                            />
                            <Text className="text-sm font-medium text-slate-900">
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    )
}
