import { useGamification } from '@/context/GamificationContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Badge variant controls colour and meaning
type BadgeVariant = 'streak' | 'level';

function TabIcon({
    focused,
    icon,
    label,
    badge,
    badgeVariant = 'streak',
}: {
    focused: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    badge?: string | number;
    badgeVariant?: BadgeVariant;
}) {
    const { colors } = useTheme();
    const color = focused ? colors.primary : colors.textSecondary;

    const badgeBg = badgeVariant === 'streak' ? '#F97316' : colors.primary;

    return (
        <View style={styles.tabItem}>
            <View>
                <Ionicons name={icon} size={22} color={color} />
                {badge !== undefined && (
                    <View style={[styles.tabBadge, { backgroundColor: badgeBg }]}>
                        <Text style={styles.tabBadgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
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
            <Animated.View
                style={[
                    styles.createBtn,
                    { backgroundColor: state.dailyGoalMet ? '#22C55E' : colors.primary },
                    animatedStyle,
                ]}
            >
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
    const { colors, isDark } = useTheme();
    const { state } = useGamification();
    const insets = useSafeAreaInsets();

    // Only show streak badge when streak is meaningful (≥3 days)
    const streakBadge = state.currentStreak >= 3 && state.currentStreak;
    // Only show level badge when the user has actually levelled up (≥2)
    const levelBadge = state.currentLevel >= 2 && state.currentLevel;

    const tabBarGradient: [string, string] = isDark
        ? ['rgba(13,21,38,0.96)', 'rgba(10,14,26,0.99)']
        : ['rgba(248,252,255,0.95)', 'rgba(255,255,255,0.99)'];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    ...styles.tabBar,
                    height: 64 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                },
                tabBarItemStyle: styles.tabBarItem,
                    tabBarBackground: () => (
                        <LinearGradient
                            colors={tabBarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[StyleSheet.absoluteFill, styles.tabBarGradient]}
                        />
                    ),
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabIcon
                                focused={focused}
                                icon={focused ? 'home' : 'home-outline'}
                                label="Home"
                                badge={!focused && streakBadge ? `🔥 ${state.currentStreak}` : undefined}
                                badgeVariant="streak"
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="journal"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabIcon
                                focused={focused}
                                icon={focused ? 'bookmark' : 'bookmark-outline'}
                                label="Journal"
                            />
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
                            <TabIcon
                                focused={focused}
                                icon={focused ? 'bar-chart' : 'bar-chart-outline'}
                                label="Insights"
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabIcon
                                focused={focused}
                                icon={focused ? 'person' : 'person-outline'}
                                label="Profile"
                                badge={!focused && levelBadge ? `Lv.${state.currentLevel}` : undefined}
                                badgeVariant="level"
                            />
                        ),
                    }}
                />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        paddingTop: 10,
        paddingHorizontal: 14,
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: 'transparent',
    },

    tabBarGradient: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(120,150,200,0.15)',
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
        top: -5,
        right: -16,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
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
