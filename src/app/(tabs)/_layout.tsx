// TAB BAR LAYOUT — src/app/(tabs)/_layout.tsx
// Defines the bottom tab bar (Home, Booking, Training, Messages, Videos).
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { colors } from '@/styles/global';
import { shadows } from '@/styles/shadows';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: boolean, active: IoniconsName, inactive: IoniconsName) {
    return ({ color }: { color: string }) => (
        <Ionicons name={focused ? active : inactive} size={22} color={color} />
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBarBorder,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: 64,
                    paddingBottom: 10,
                    paddingTop: 8,
                    // Subtle top shadow lifts the tab bar off the content below.
                    ...shadows.sm,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) =>
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="booking"
                options={{
                    title: 'Booking',
                    tabBarIcon: ({ color, focused }) =>
                        <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color, focused }) =>
                        <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="training"
                options={{
                    title: 'Training',
                    tabBarIcon: ({ color, focused }) =>
                        <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="videos"
                options={{
                    title: 'Videos',
                    tabBarIcon: ({ color, focused }) =>
                        <Ionicons name={focused ? 'videocam' : 'videocam-outline'} size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}
