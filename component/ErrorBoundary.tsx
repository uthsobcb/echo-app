import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        if (__DEV__) {
            console.error('ErrorBoundary caught:', error, info.componentStack);
        }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>😵</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.props.fallbackMessage ?? 'An unexpected error occurred. Please try again.'}
                    </Text>
                    {__DEV__ && this.state.error && (
                        <Text style={styles.debug}>{this.state.error.message}</Text>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#F5F6FA',
    },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: '#1A1D2E', marginBottom: 8 },
    message: { fontSize: 15, color: '#7A8499', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    debug: { fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 16, fontFamily: 'monospace' },
    button: {
        backgroundColor: '#4F6BFF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
