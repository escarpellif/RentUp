import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ApproximateLocationMap({ coordinates, locationApprox }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Approximate location</Text>

            <View style={styles.mapPlaceholder}>
                <View style={styles.circle}>
                    <Text style={styles.circleText}>📍</Text>
                </View>
                <Text style={styles.areaText}>~300m radius area</Text>
            </View>

            {locationApprox && (
                <Text style={styles.locationText}>📍 {locationApprox}</Text>
            )}

            <Text style={styles.disclaimer}>Exact location provided after booking</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        padding: 16,
        paddingBottom: 12,
    },
    mapPlaceholder: {
        width: '100%',
        height: 250,
        backgroundColor: '#f0e6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#d4b3ff',
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(138, 43, 226, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(138, 43, 226, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    circleText: {
        fontSize: 48,
    },
    areaText: {
        fontSize: 14,
        color: '#8a2be2',
        fontWeight: '500',
    },
    locationText: {
        fontSize: 16,
        color: '#333',
        padding: 16,
        paddingTop: 12,
        fontWeight: '500',
    },
    disclaimer: {
        fontSize: 13,
        color: '#888',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
        textAlign: 'left',
    },
});

