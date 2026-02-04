import React from 'react';
import {View, Text } from 'react-native';
import { webStyles } from '../styles/components/exactLocationMap.webStyles';

export default function ExactLocationMap({ coordinates, location }) {
    // Verificar se temos coordenadas válidas
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return (
            <View style={webStyles.containerNoMap}>
                <View style={webStyles.noLocationContainer}>
                    <Text style={webStyles.noLocationText}>
                        Ubicación no disponible en el mapa
                    </Text>
                </View>
            </View>
        );
    }

    // Web: Mostrar placeholder com coordenadas
    return (
        <View style={webStyles.container}>
            <View style={webStyles.webMapPlaceholder}>
                <Text style={webStyles.webMapTitle}>📍 Ubicación del Artículo</Text>
                <Text style={webStyles.webMapCoords}>
                    Lat: {coordinates.latitude.toFixed(6)}
                </Text>
                <Text style={webStyles.webMapCoords}>
                    Lng: {coordinates.longitude.toFixed(6)}
                </Text>
                <Text style={webStyles.webMapNote}>
                    {location || 'Ubicación exacta'}
                </Text>
                <Text style={webStyles.webMapInfo}>
                    💡 Los mapas interactivos solo están disponibles en la app móvil
                </Text>
                <Text style={webStyles.webMapLink}>
                    Ver en Google Maps →
                </Text>
            </View>
        </View>
    );
}



