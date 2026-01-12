import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaticContentScreen({ route, navigation }) {
    const { title, content } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    <View style={styles.leftHeader}>
                        <TouchableOpacity
                            style={styles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{title}</Text>
                    </View>

                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer}>
                <View style={styles.contentCard}>
                    {content}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8EAED',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
        backgroundColor: '#10B981',
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContainer: {
        flex: 1,
    },
    contentCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});

