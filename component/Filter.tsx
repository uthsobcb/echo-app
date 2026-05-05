import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface FilterOption {
  label: string;
  count: number;
}

interface FilterProps {
  options: FilterOption[];
  selected: string;
  onSelect: (filter: string) => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', joy: '😄', great: '🌟', good: '🙂',
  sad: '😢', down: '😞', depressed: '😔',
  angry: '😠', frustrated: '😤',
  anxious: '😰', worried: '😟', nervous: '😬',
  calm: '😌', peaceful: '🕊️', relaxed: '😮‍💨',
  excited: '🎉', energetic: '⚡', thrilled: '🤩',
  grateful: '🙏', thankful: '💙',
  neutral: '😐', okay: '🆗',
  tired: '😴', exhausted: '😩',
  proud: '🏆', accomplished: '✅',
  curious: '🤔', thoughtful: '💭',
};

function getMoodEmoji(label: string): string {
  return MOOD_EMOJIS[label.toLowerCase()] ?? '•';
}

const Filter = ({ options, selected, onSelect }: FilterProps) => {
  const { colors } = useTheme();

  if (options.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {options.map((item) => {
          const isSelected = item.label === selected;
          const emoji = item.label === 'All' ? '📖' : getMoodEmoji(item.label);
          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.75}
              onPress={() => onSelect(item.label)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.chipEmoji}>{emoji}</Text>
              <Text style={[styles.chipLabel, { color: isSelected ? '#fff' : colors.text }]}>
                {item.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.countText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:       { marginBottom: 8 },
  scroll:     { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  chipEmoji:  { fontSize: 14 },
  chipLabel:  { fontSize: 13, fontWeight: '600' },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countText:  { fontSize: 11, fontWeight: '700' },
});

export default Filter;
