import React, { useState, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { testimonialsStyles as styles } from '../styles/testimonialsStyles';
import { useTranslation } from 'react-i18next';

export default function TestimonialsSection() {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef(null);

    // TEMPORÁRIO: Valor fixo para debug
    const width = 375;
    const CARD_WIDTH = width * 0.85;
    const CARD_MARGIN = 10;

    const testimonials = [
        {
            id: 1,
            name: t('testimonials.testimonial1.name'),
            text: t('testimonials.testimonial1.text'),
            rating: 5,
            location: t('testimonials.testimonial1.location')
        },
        {
            id: 2,
            name: t('testimonials.testimonial2.name'),
            text: t('testimonials.testimonial2.text'),
            rating: 5,
            location: t('testimonials.testimonial2.location')
        },
        {
            id: 3,
            name: t('testimonials.testimonial3.name'),
            text: t('testimonials.testimonial3.text'),
            rating: 5,
            location: t('testimonials.testimonial3.location')
        },
        {
            id: 4,
            name: t('testimonials.testimonial4.name'),
            text: t('testimonials.testimonial4.text'),
            rating: 5,
            location: t('testimonials.testimonial4.location')
        },
        {
            id: 5,
            name: t('testimonials.testimonial5.name'),
            text: t('testimonials.testimonial5.text'),
            rating: 5,
            location: t('testimonials.testimonial5.location')
        },
    ];

    const renderHearts = (rating) => {
        const hearts = [];
        for (let i = 0; i < 5; i++) {
            hearts.push(
                <Text key={i} style={styles.heart}>
                    {i < rating ? '❤️' : '🤍'}
                </Text>
            );
        }
        return hearts;
    };

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_MARGIN * 2));
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('home.whatUsersSay')}</Text>
            <Text style={styles.sectionSubtitle}>Experiencias reales de nuestra comunidad</Text>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                snapToAlignment="center"
                contentContainerStyle={styles.scrollContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {testimonials.map((testimonial) => (
                    <View
                        key={testimonial.id}
                        style={[
                            styles.testimonialCard,
                            { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }
                        ]}
                    >
                        <View style={styles.quoteIcon}>
                            <Text style={styles.quoteText}>&ldquo;</Text>
                        </View>

                        <Text style={styles.testimonialText}>{testimonial.text}</Text>

                        <View style={styles.ratingContainer}>
                            {renderHearts(testimonial.rating)}
                        </View>

                        <View style={styles.authorContainer}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>
                                    {testimonial.name.charAt(0)}
                                </Text>
                            </View>
                            <View style={styles.authorInfo}>
                                <Text style={styles.authorName}>{testimonial.name}</Text>
                                <Text style={styles.authorLocation}>📍 {testimonial.location}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Indicadores de Paginação */}
            <View style={styles.paginationContainer}>
                {testimonials.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === activeIndex && styles.paginationDotActive
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

