import React, { useState } from 'react';
import { View, Image, ScrollView, TouchableOpacity, Text } from 'react-native';
import { photoCarouselStyles } from '../styles/components/photoCarouselStyles';

export default function PhotoCarousel({ photos, supabaseUrl }) {
    const [activeIndex, setActiveIndex] = useState(0);

    // TEMPORÁRIO: Valor fixo para debug
    const width = 375;

    const handleScroll = (event) => {
        try {
            const scrollPosition = event.nativeEvent.contentOffset.x;
            const index = Math.round(scrollPosition / width);
            setActiveIndex(index);
        } catch (error) {
            console.log('Erro ao calcular scroll:', error);
        }
    };

    return (
        <View style={photoCarouselStyles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={photoCarouselStyles.scrollView}
            >
                {photos.map((photo, index) => (
                    <View key={index} style={photoCarouselStyles.imageContainer}>
                        <Image
                            source={{ uri: `${supabaseUrl}/storage/v1/object/public/item_photos/${photo}` }}
                            style={photoCarouselStyles.image}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Indicadores de pontos */}
            <View style={photoCarouselStyles.dotsContainer}>
                {photos.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            photoCarouselStyles.dot,
                            index === activeIndex && photoCarouselStyles.activeDot
                        ]}
                    />
                ))}
            </View>

            {/* Contador de fotos */}
            <View style={photoCarouselStyles.counterContainer}>
                <Text style={photoCarouselStyles.counterText}>
                    {activeIndex + 1} / {photos.length}
                </Text>
            </View>
        </View>
    );
}



