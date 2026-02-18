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
          <Text className={`font-semibold px-5 py-2.5 rounded-full overflow-hidden border ${selectedFilter === item ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-gray-600 border-gray-200'}`} onPress={() => setSelectedFilter(item)}>
            {item}
          </Text>
        }
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className='w-4' />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
      />
    </View>
  )
}

export default Filter;