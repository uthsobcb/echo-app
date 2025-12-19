import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function AuthLayout() {
    console.log("Auth layout rendered");
    return (
        <SafeAreaView className='flex-1 bg-red-500'>
            <View className='bg-red-500 flex-1 items-center justify-center'>
                <Text>Auth layout</Text>
            </View>
        </SafeAreaView>
    )
}