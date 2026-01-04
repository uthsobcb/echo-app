import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
} from 'react-native'

interface SearchResult {
    id: string
    title: string
    matchedText: string
    conversationId: string
}

interface ConversationSearchProps {
    isVisible: boolean
    onClose: () => void
    onSelectResult: (result: SearchResult) => void
    results: SearchResult[]
    isLoading?: boolean
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
    isVisible,
    onClose,
    onSelectResult,
    results,
    isLoading = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('')

    if (!isVisible) return null

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                {/* Search Header */}
                <View className="border-b border-slate-200 bg-white px-4 py-3 pt-12">
                    <View className="flex flex-row items-center gap-2">
                        <MaterialCommunityIcons
                            name="magnify"
                            size={24}
                            color="#94a3b8"
                        />
                        <TextInput
                            placeholder="Search messages..."
                            placeholderTextColor="#cbd5e1"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            className="flex-1 text-base text-slate-900"
                        />
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color="#64748b"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Results */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <MaterialCommunityIcons
                            name="loading"
                            size={32}
                            color="#3b82f6"
                        />
                        <Text className="mt-4 text-sm text-slate-500">
                            Searching...
                        </Text>
                    </View>
                ) : results.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <MaterialCommunityIcons
                            name="magnify"
                            size={48}
                            color="#cbd5e1"
                        />
                        <Text className="mt-4 text-sm text-slate-500">
                            {searchQuery
                                ? 'No results found'
                                : 'Start typing to search'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    onSelectResult(item)
                                    onClose()
                                }}
                                className="border-b border-slate-100 px-4 py-3 active:bg-slate-50"
                            >
                                <Text className="mb-1 font-semibold text-slate-900">
                                    {item.title}
                                </Text>
                                <Text
                                    numberOfLines={2}
                                    className="text-sm text-slate-600"
                                >
                                    {item.matchedText}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </Modal>
    )
}
