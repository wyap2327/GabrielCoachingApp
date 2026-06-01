import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/styles/global';

export default function HomeScreen() {
    const { signOut } = useAuth();

    function handleLogout() {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    // _layout.tsx watches `user` and redirects to /auth/login
                    // automatically when it becomes null — no navigation needed here.
                },
            },
        ]);
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header row — title on left, logout icon on right */}
                <View style={styles.header}>
                    <Text style={styles.title}>Belibi Tennis Coaching</Text>
                    <TouchableOpacity onPress={handleLogout} accessibilityLabel="Sign out">
                        <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
});
