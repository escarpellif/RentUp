import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function ExactLocationMap({ coordinates, location }) {
    const [currentRegion, setCurrentRegion] = useState(null);

    useEffect(() => {
        if (coordinates && coordinates.latitude && coordinates.longitude) {
            setCurrentRegion({
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    }, [coordinates]);

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

    if (!currentRegion) {
        return null; // Aguarda a região ser configurada
    }

    // Criar uma key única baseada nas coordenadas para forçar re-renderização quando mudar
    const mapKey = `${coordinates.latitude}-${coordinates.longitude}`;

    return (
        <View style={styles.container}>
            <MapView
                key={mapKey}
                style={styles.map}
                region={currentRegion}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
            >
                <Marker
                    coordinate={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                    }}
                    title={location || 'Ubicación del artículo'}
                    description="Lugar de recogida"
                />
            </MapView>
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
    map: {
        width: '100%',
        height: 250,
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
});

