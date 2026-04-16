import { useGamification } from '@/context/GamificationContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

function TabIcon({
    focused,
    icon,
    label,
    badge,
}: {
    focused: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    badge?: string | number;
}) {
    const { colors } = useTheme();
    const color = focused ? colors.primary : colors.textSecondary;

    return (
        <View style={styles.tabItem}>
            <View>
                <Ionicons name={icon} size={22} color={color} />
                {badge !== undefined && (
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{badge}</Text>
                    </View>
                )}
            </View>
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
    const { colors } = useTheme();
    const { state } = useGamification();
    const scale = useSharedValue(1);

    useEffect(() => {
        if (!state.dailyGoalMet) {
            // Gentle pulse to draw attention when daily goal not met
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 1000 }),
                    withTiming(1, { duration: 1000 }),
                ),
                -1,
                true,
            );
        } else {
            scale.value = withTiming(1, { duration: 200 });
        }
    }, [state.dailyGoalMet]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable onPress={(e) => onPress?.(e)} style={styles.createWrap}>
            <Animated.View style={[styles.createBtn, { backgroundColor: state.dailyGoalMet ? '#22C55E' : colors.primary }, animatedStyle]}>
                {state.dailyGoalMet ? (
                    <Ionicons name="checkmark" size={28} color="#fff" />
                ) : (
                    <Ionicons name="add" size={28} color="#fff" />
                )}
            </Animated.View>
        </Pressable>
    );
}

export default function TabsLayout() {
    const { colors } = useTheme();
    const { state } = useGamification();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface }],
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused}
                            icon="home"
                            label="Home"
                            badge={state.currentStreak > 0 && !focused ? `${state.currentStreak}` : undefined}
                        />
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
                        <TabIcon
                            focused={focused}
                            icon="person"
                            label="Profile"
                            badge={!focused ? `${state.currentLevel}` : undefined}
                        />
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
        borderTopWidth: 0,
        elevation: 0,
    },

    tabBarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    tabItem: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },

    tabLabel: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        includeFontPadding: false,
        lineHeight: 14,
    },

    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#F59E0B',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
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
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#4F6BFF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
});
