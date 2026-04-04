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
    <View className="mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 gap-2"
      >
        {FILTERS.map((item) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => onSelect(item)}
              className={`px-[18px] py-2 rounded-full ${isSelected ? '' : ''}`}
              style={{
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
            >
              <Text 
                className="text-[13px] font-semibold"
                style={{ color: isSelected ? '#fff' : colors.textSecondary }}
              >
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
