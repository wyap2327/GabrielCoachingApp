import { StyleSheet } from 'react-native';

export const colors = {
    background: '#1a1a2e',
    header: '#242444',
    surface: '#2a2a4a',
    surfaceHigh: '#32325a',
    primary: '#4fc3f7',
    primaryDim: '#1a7fa8',
    text: '#ffffff',
    textSecondary: '#a0a0b0',
    textMuted: '#6b6b85',
    border: '#3a3a5c',
    alert: '#ff5252',
    success: '#4caf50',
    warning: '#ff9800',
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 30,
        marginBottom: 16,
    },
    empty: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
