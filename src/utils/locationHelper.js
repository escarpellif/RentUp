// Função para calcular a distância entre duas coordenadas usando a fórmula de Haversine
// Retorna a distância em quilômetros
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Retorna em km
};

// Converter graus para radianos
const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Opções de filtro de distância
export const distanceOptions = [
    { id: 'all', label: 'Todas las distancias', value: null },
    { id: '3km', label: 'Hasta 3 km', value: 3 },
    { id: '5km', label: 'Hasta 5 km', value: 5 },
    { id: '10km', label: 'Hasta 10 km', value: 10 },
    { id: '20km', label: 'Hasta 20 km', value: 20 },
    { id: '50km', label: 'Hasta 50 km', value: 50 },
];

// Função para obter coordenadas a partir de um endereço usando geocoding
export const getCoordinatesFromAddress = async (address) => {
    if (!address) {
        return null;
    }

    try {
        // Usar API de geocoding gratuita (Nominatim do OpenStreetMap)
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
        );

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting coordinates from address:', error);
        return null;
    }
};

// Função para obter localização aproximada (adicionar offset aleatório)
export const getApproximateLocation = (coordinates) => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return null;
    }

    return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
    };
};

// Adicionar offset aleatório às coordenadas para privacidade
export const addRandomOffset = (coordinates, radiusInKm = 0.5) => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return coordinates;
    }

    // Converter km para graus (aproximadamente)
    // 1 grau de latitude ≈ 111 km
    // 1 grau de longitude ≈ 111 km * cos(latitude)
    const latOffset = (Math.random() - 0.5) * 2 * (radiusInKm / 111);
    const lonOffset = (Math.random() - 0.5) * 2 * (radiusInKm / (111 * Math.cos(toRad(coordinates.latitude))));

    return {
        latitude: coordinates.latitude + latOffset,
        longitude: coordinates.longitude + lonOffset,
    };
};
