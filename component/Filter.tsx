import React from 'react';
import { FlatList, Text, View } from 'react-native';

const Filter = () => {
  const filters = ["All", "Happy", "Sad", "Excited", "Angry"];
  const [selectedFilter, setSelectedFilter] = React.useState("All");
  return (
    <View>
      <FlatList
        data={filters}
        renderItem={({ item }) =>
          <Text className={`text-gray-700 font-semibold p-3 rounded-2xl ${selectedFilter === item ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onPress={() => setSelectedFilter(item)}>
            {item}
          </Text>
        }
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className='w-4' />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      />
    </View>
  )
}

export default Filter;