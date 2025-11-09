import React, { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Dimensions, TouchableOpacity, Text } from 'react-native';

const { width } = Dimensions.get('window');

export default function PhotoCarousel({ photos, supabaseUrl }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {photos.map((photo, index) => (
                    <View key={index} style={styles.imageContainer}>
                        <Image
                            source={{ uri: `${supabaseUrl}/storage/v1/object/public/item_photos/${photo}` }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Indicadores de pontos */}
            <View style={styles.dotsContainer}>
                {photos.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex && styles.activeDot
                        ]}
                    />
                ))}
            </View>

            {/* Contador de fotos */}
            <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                    {activeIndex + 1} / {photos.length}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 300,
        backgroundColor: '#000',
    },
    scrollView: {
        width: '100%',
        height: 300,
    },
    imageContainer: {
        width: width,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 24,
    },
    counterContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    counterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

