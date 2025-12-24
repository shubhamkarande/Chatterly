import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#0f172a',
                    borderTopColor: '#1e293b',
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarActiveTintColor: '#0ea5e9',
                tabBarInactiveTintColor: '#64748b',
                headerStyle: {
                    backgroundColor: '#0f172a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '600' as const,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="contacts"
                options={{
                    title: 'Contacts',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="new-group"
                options={{
                    href: null, // Hide from tabs
                    title: 'New Group',
                }}
            />
        </Tabs>
    );
}

