import { Stack } from 'expo-router';
import { ChatProvider } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';

function ChatLayout() {
    const { colors } = useTheme();
    
    return (
        <ChatProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="chat" />
            </Stack>
        </ChatProvider>
    );
}

export default ChatLayout;