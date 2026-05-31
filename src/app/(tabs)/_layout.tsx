import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/global';

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
                    backgroundColor: colors.header,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 64,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
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
