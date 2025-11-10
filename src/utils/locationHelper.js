/**
 * Extrai a localização aproximada de um endereço completo
 * Para privacidade, mostra apenas o bairro/cidade e código postal
 */
export const getApproximateLocation = (fullAddress) => {
    if (!fullAddress) return 'Ubicación no especificada';
    
    // Se o endereço contém vírgulas, pega a parte do bairro/cidade
    const parts = fullAddress.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
        // Retorna cidade/bairro e código postal (se tiver)
        const cityPart = parts[parts.length - 2] || parts[0];
        const postalMatch = fullAddress.match(/\d{5}/);
        
        if (postalMatch) {
            return `${cityPart} - ${postalMatch[0]}`;
        }
        return cityPart;
    }
    
    return fullAddress;
};

/**
 * Obtém coordenadas de um endereço usando Nominatim
 */
export const getCoordinatesFromAddress = async (address) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&country=Spain&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'RentUpApp/1.0'
                }
            }
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
        console.error('Erro ao obter coordenadas:', error);
        return null;
    }
};

/**
 * Adiciona um offset aleatório às coordenadas para proteger a localização exata
 * Offset de aproximadamente 200-500 metros
 */
export const addRandomOffset = (coordinates) => {
    if (!coordinates) return null;
    
    // Offset aleatório entre 0.002 e 0.005 graus (~200-500 metros)
    const offsetLat = (Math.random() - 0.5) * 0.007;
    const offsetLng = (Math.random() - 0.5) * 0.007;
    
    return {
        latitude: coordinates.latitude + offsetLat,
        longitude: coordinates.longitude + offsetLng,
    };
};

