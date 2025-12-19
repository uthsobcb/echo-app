import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function TabIcon({
    focused,
    icon,
    label,
}: {
    focused: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}) {
    const color = focused ? '#2F6BFF' : '#98A2B3';

    return (
        <View style={styles.tabItem}>
            <Ionicons name={icon} size={22} color={color} />
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.tabLabel, { color }]}
            >
                {label}
            </Text>
        </View>
    );
}

function CreateButton({
    onPress,
}: {
    onPress?: React.ComponentProps<typeof Pressable>['onPress'];
}) {
    return (
        <Pressable onPress={(e) => onPress?.(e)} style={styles.createWrap}>
            <View style={styles.createBtn}>
                <Ionicons name="add" size={28} color="#fff" />
            </View>
        </Pressable>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="home" label="Home" />
                    ),
                }}
            />

            <Tabs.Screen
                name="journal"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="bookmark" label="Journal" />
                    ),
                }}
            />

            <Tabs.Screen
                name="create"
                options={{
                    tabBarIcon: () => null,
                    tabBarButton: (props) => <CreateButton onPress={props.onPress} />,
                }}
            />

            <Tabs.Screen
                name="insights"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="bar-chart" label="Insights" />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="person" label="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 76,
        paddingTop: 10,
        paddingBottom: 12,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
    },

    // Give each tab a consistent "slot" width so labels don't wrap
    tabBarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    tabItem: {
        width: 72,              // key: stable width so text aligns
        alignItems: 'center',
        justifyContent: 'center',
    },

    tabLabel: {
        marginTop: 4,
        fontSize: 11,           // slightly smaller to avoid wrapping
        fontWeight: '600',
        textAlign: 'center',
        includeFontPadding: false, // Android alignment fix
        lineHeight: 14,
    },

    createWrap: {
        top: -24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBtn: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#0B1220',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
});
