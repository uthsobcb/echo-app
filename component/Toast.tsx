import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
}

// ─── Imperative API ───────────────────────────────────────────────────────────
let _push: ((entry: Omit<ToastEntry, 'id'>) => void) | null = null;

export const Toast = {
    show(message: string, type: ToastType = 'info', title?: string) {
        _push?.({ message, type, title });
    },
    success(message: string, title?: string) { this.show(message, 'success', title); },
    error(message: string, title?: string)   { this.show(message, 'error',   title); },
    info(message: string, title?: string)    { this.show(message, 'info',    title); },
    warning(message: string, title?: string) { this.show(message, 'warning', title); },
};

// ─── Visual config ────────────────────────────────────────────────────────────
const CONFIG: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string; titleColor: string }> = {
    success: { bg: '#ECFDF5', border: '#10B981', icon: 'checkmark-circle',   iconColor: '#059669', titleColor: '#065F46' },
    error:   { bg: '#FEF2F2', border: '#EF4444', icon: 'close-circle',       iconColor: '#DC2626', titleColor: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#3B82F6', icon: 'information-circle', iconColor: '#2563EB', titleColor: '#1E40AF' },
    warning: { bg: '#FFFBEB', border: '#F59E0B', icon: 'warning',            iconColor: '#D97706', titleColor: '#92400E' },
};

// ─── Single animated toast ────────────────────────────────────────────────────
function ToastItem({ entry, index }: { entry: ToastEntry; index: number }) {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-120);
    const opacity = useSharedValue(0);
    const cfg = CONFIG[entry.type];

    useEffect(() => {
        translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
        opacity.value = withTiming(1, { duration: 180 });
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    top: insets.top + 12 + index * 80,
                    backgroundColor: cfg.bg,
                    borderColor: cfg.border,
                },
                animStyle,
            ]}
        >
            <Ionicons name={cfg.icon as any} size={22} color={cfg.iconColor} style={styles.icon} />
            <View style={{ flex: 1 }}>
                {entry.title ? (
                    <Text style={[styles.title, { color: cfg.titleColor }]}>{entry.title}</Text>
                ) : null}
                <Text style={[styles.message, !entry.title && styles.messageOnly]}>
                    {entry.message}
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Container — render once in root layout ───────────────────────────────────
export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    useEffect(() => {
        _push = (entry) => {
            const id = `${Date.now()}-${Math.random()}`;
            setToasts(prev => [...prev.slice(-2), { ...entry, id }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3400);
        };
        return () => { _push = null; };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <>
            {toasts.map((t, i) => (
                <ToastItem key={t.id} entry={t} index={i} />
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        zIndex: 9999,
    },
    icon: { marginTop: 1 },
    title: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    messageOnly: {
        fontWeight: '600',
        color: '#111827',
    },
});
