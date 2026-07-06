import { Redirect, useLocalSearchParams } from 'expo-router';

// Deep-link target for server links: my-echo://connect?server=https://echo.example.com
export default function Connect() {
    const { server } = useLocalSearchParams<{ server?: string }>();
    return <Redirect href={{ pathname: '/(auth)/server', params: { server: server ?? '' } }} />;
}
