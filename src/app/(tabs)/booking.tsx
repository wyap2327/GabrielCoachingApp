import { colors } from '@/styles/global';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingScreen() {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Booking</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 8 },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
});
