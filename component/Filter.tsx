import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const FILTERS = ['All', 'Happy', 'Sad', 'Excited', 'Angry', 'Anxious', 'Grateful', 'Neutral'];

interface FilterProps {
    selected: string;
    onSelect: (filter: string) => void;
}

const Filter = ({ selected, onSelect }: FilterProps) => {
    const { colors } = useTheme();

    return (
        <View style={{ marginBottom: 8 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
                {FILTERS.map((item) => {
                    const isSelected = item === selected;
                    return (
                        <TouchableOpacity
                            key={item}
                            activeOpacity={0.8}
                            onPress={() => onSelect(item)}
                            style={{
                                paddingHorizontal: 18,
                                paddingVertical: 8,
                                borderRadius: 50,
                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                borderWidth: 1.5,
                                borderColor: isSelected ? colors.primary : colors.border,
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: isSelected ? '#fff' : colors.textSecondary,
                            }}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default Filter;
