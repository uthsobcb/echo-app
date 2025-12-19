import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="insights"
                options={{
                    title: 'Insights',
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="journal"
                options={{
                    title: 'Journal',
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false
                }}
            />
        </Tabs>
    )
}