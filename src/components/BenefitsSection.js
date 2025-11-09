import React from 'react';
import { View, Text } from 'react-native';
import { benefitsSectionStyles as styles } from '../styles/benefitsSectionStyles';

export default function BenefitsSection() {
    const benefits = [
        {
            id: 1,
            icon: '✅',
            title: 'Todos están verificados',
            subtitle: 'RentUp es seguro.',
            description: 'Todos los anunciantes y arrendadores tienen su identidad verificada.'
        },
        {
            id: 2,
            icon: '⏰',
            title: 'Horarios que te convienen',
            subtitle: 'Flexible',
            description: 'Antes y después del trabajo y fines de semana funciona mejor, tal como debería ser.'
        },
        {
            id: 3,
            icon: '💰',
            title: 'Más barato que comprar',
            subtitle: 'A menudo 60% más barato',
            description: 'Es a menudo 60% más barato alquilar a través de RentUp que a una empresa.'
        },
        {
            id: 4,
            icon: '💵',
            title: 'Haz dinero con artículos que no usas',
            subtitle: 'Genera ingresos',
            description: 'Convierte tus artículos parados en una fuente de ingresos extra.'
        },
        {
            id: 5,
            icon: '🚴‍♂️',
            title: 'Alquila en tu zona',
            subtitle: 'Cerca de ti',
            description: 'Por lo general, puedes alquilar algo más cerca de ti que en la tienda más cercana.'
        },

        {
            id: 6,
            icon: '👍',
            title: 'Bueno para el medio ambiente',
            subtitle: 'Sostenible',
            description: 'Cuanto más se usan las cosas, impactamos menos el medio ambiente.'
        },

    ];

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>¿Por qué elegir RentUp?</Text>
            <Text style={styles.sectionSubtitle}>Descubre todas las ventajas de alquilar</Text>

            <View style={styles.benefitsGrid}>
                {benefits.map((benefit) => (
                    <View key={benefit.id} style={styles.benefitCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                        </View>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

