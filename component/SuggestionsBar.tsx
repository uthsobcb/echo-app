import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

interface SuggestionChip {
    id: string
    label: string
    icon?: string
}

interface SuggestionsBarProps {
    suggestions: SuggestionChip[]
    onSelectSuggestion: (suggestion: SuggestionChip) => void
}

export const SuggestionsBar: React.FC<SuggestionsBarProps> = ({
    suggestions,
    onSelectSuggestion,
}) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="border-b border-slate-200 bg-white px-4 py-3"
        >
            <View className="flex flex-row gap-2">
                {suggestions.map((suggestion) => (
                    <TouchableOpacity
                        key={suggestion.id}
                        onPress={() => onSelectSuggestion(suggestion)}
                        className="flex flex-row items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2 active:bg-blue-100"
                    >
                        {suggestion.icon && (
                            <MaterialCommunityIcons
                                name={suggestion.icon as any}
                                size={16}
                                color="#3b82f6"
                            />
                        )}
                        <Text className="text-sm font-medium text-blue-600">
                            {suggestion.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    )
}
