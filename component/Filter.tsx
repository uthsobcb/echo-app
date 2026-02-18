import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const Filter = () => {
  const filters = ["All", "Happy", "Sad", "Excited", "Angry"];

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {filters.map((item, index) => {
          // Simulate: Only "All" is selected
          const isSelected = item === "All";
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              className={`px-6 py-2 rounded-full border ${isSelected
                ? 'bg-blue-500 border-blue-500/80'
                : 'bg-white border-gray-200'
                }`}
            >
              <Text
                className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-700'
                  }`}
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