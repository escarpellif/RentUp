import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { exactLocationMapNativeStyles } from '../styles/components/exactLocationMap.nativeStyles';

// Importação condicional para evitar erro no web
let MapView, Marker;
if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
}

export default function ExactLocationMap({ coordinates, location }) {
    const [currentRegion, setCurrentRegion] = useState(null);
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        try {
            if (coordinates && coordinates.latitude && coordinates.longitude) {
                setCurrentRegion({
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        } catch (error) {
            console.error('[ExactLocationMap] Error setting region:', error);
            setMapError(true);
        }
    }, [coordinates]);

    // Verificar se temos coordenadas válidas ou se houve erro
    if (mapError || !coordinates || !coordinates.latitude || !coordinates.longitude) {
        return (
            <View style={exactLocationMapNativeStyles.containerNoMap}>
                <View style={exactLocationMapNativeStyles.noLocationContainer}>
                    <Text style={exactLocationMapNativeStyles.noLocationText}>
                        {mapError ? 'Error al cargar el mapa' : 'Ubicación no disponible en el mapa'}
                    </Text>
                </View>
            </View>
        );
    }

    // Fallback para web (MapView não disponível)
    if (Platform.OS === 'web') {
        return (
            <View style={exactLocationMapNativeStyles.container}>
                <View style={exactLocationMapNativeStyles.webMapPlaceholder}>
                    <Text style={exactLocationMapNativeStyles.webMapTitle}>📍 Ubicación del Artículo</Text>
                    <Text style={exactLocationMapNativeStyles.webMapCoords}>
                        Lat: {coordinates.latitude.toFixed(6)}
                    </Text>
                    <Text style={exactLocationMapNativeStyles.webMapCoords}>
                        Lng: {coordinates.longitude.toFixed(6)}
                    </Text>
                    <Text style={exactLocationMapNativeStyles.webMapNote}>
                        {location || 'Ubicación exacta'}
                    </Text>
                    <Text style={exactLocationMapNativeStyles.webMapInfo}>
                        💡 Los mapas solo están disponibles en la app móvil
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

    // Renderizar mapa com proteção contra erros
    try {
        return (
            <View style={exactLocationMapNativeStyles.container}>
                <MapView
                    key={mapKey}
                    style={exactLocationMapNativeStyles.map}
                    region={currentRegion}
                    scrollEnabled={true}
                    zoomEnabled={true}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    onError={(error) => {
                        console.error('[MapView] Error:', error);
                        setMapError(true);
                    }}
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
    } catch (error) {
        console.error('[ExactLocationMap] Render error:', error);
        return (
            <View style={exactLocationMapNativeStyles.containerNoMap}>
                <View style={exactLocationMapNativeStyles.noLocationContainer}>
                    <Text style={exactLocationMapNativeStyles.noLocationText}>
                        Error al mostrar el mapa
                    </Text>
                </View>
            </View>
        );
    }
}



