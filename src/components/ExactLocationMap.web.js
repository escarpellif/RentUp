import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExactLocationMap({ coordinates, location }) {
    // Verificar se temos coordenadas válidas
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return (
            <View style={styles.containerNoMap}>
                <View style={styles.noLocationContainer}>
                    <Text style={styles.noLocationText}>
                        Ubicación no disponible en el mapa
                    </Text>
                </View>
            </View>
        );
    }

    // Web: Mostrar placeholder com coordenadas
    return (
        <View style={styles.container}>
            <View style={styles.webMapPlaceholder}>
                <Text style={styles.webMapTitle}>📍 Ubicación del Artículo</Text>
                <Text style={styles.webMapCoords}>
                    Lat: {coordinates.latitude.toFixed(6)}
                </Text>
                <Text style={styles.webMapCoords}>
                    Lng: {coordinates.longitude.toFixed(6)}
                </Text>
                <Text style={styles.webMapNote}>
                    {location || 'Ubicación exacta'}
                </Text>
                <Text style={styles.webMapInfo}>
                    💡 Los mapas interactivos solo están disponibles en la app móvil
                </Text>
                <Text style={styles.webMapLink}>
                    Ver en Google Maps →
                </Text>
            </View>
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
    containerNoMap: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    noLocationContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    noLocationText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    // Estilos para web placeholder
    webMapPlaceholder: {
        padding: 24,
        backgroundColor: '#f8f9fa',
        minHeight: 250,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e9ecef',
        borderStyle: 'dashed',
    },
    webMapTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    webMapCoords: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    webMapNote: {
        fontSize: 16,
        color: '#495057',
        marginTop: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    webMapInfo: {
        fontSize: 13,
        color: '#6c757d',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    webMapLink: {
        fontSize: 14,
        color: '#007bff',
        marginTop: 12,
        textDecorationLine: 'underline',
    },
});

