import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { testimonialsStyles as styles } from '../styles/testimonialsStyles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_MARGIN = 10;

export default function TestimonialsSection() {
    const testimonials = [
        {
            id: 1,
            name: 'María González',
            text: 'Una manera excelente de no gastar acumulando artículos y aún hacer una renta extra. ¡100% recomendado!',
            rating: 5,
            location: 'Madrid'
        },
        {
            id: 2,
            name: 'Carlos Rodríguez',
            text: 'Fácil y práctico de alquilar. La plataforma es muy intuitiva y segura.',
            rating: 5,
            location: 'Barcelona'
        },
        {
            id: 3,
            name: 'Ana Martínez',
            text: 'Perfecto para artículos que solo necesitas ocasionalmente. Ahorro mucho dinero.',
            rating: 5,
            location: 'Valencia'
        },
        {
            id: 4,
            name: 'Luis Fernández',
            text: 'Mis artículos que estaban guardados ahora me generan ingresos. ¡Genial!',
            rating: 5,
            location: 'Sevilla'
        },
        {
            id: 5,
            name: 'Isabel Torres',
            text: 'Muy confiable. Todos están verificados y el proceso es súper sencillo.',
            rating: 5,
            location: 'Bilbao'
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

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Lo que nuestros usuarios piensan</Text>
            <Text style={styles.sectionSubtitle}>Experiencias reales de nuestra comunidad</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                snapToAlignment="center"
                contentContainerStyle={styles.scrollContent}
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
        </View>
    );
}

