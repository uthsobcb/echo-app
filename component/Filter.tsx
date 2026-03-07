import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FILTERS = ['All', 'Happy', 'Sad', 'Excited', 'Angry', 'Anxious', 'Grateful', 'Neutral'];

interface FilterProps {
  selected: string;
  onSelect: (filter: string) => void;
}

const Filter = ({ selected, onSelect }: FilterProps) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {FILTERS.map((item) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => onSelect(item)}
              style={[styles.pill, isSelected && styles.pillActive]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
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

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  scroll: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E8F0',
  },
  pillActive: {
    backgroundColor: '#4F6BFF',
    borderColor: '#4F6BFF',
  },
  pillText: { fontSize: 13, fontWeight: '600', color: '#7A8499' },
  pillTextActive: { color: '#fff' },
});