import React from 'react';
import { View, Text } from 'react-native';
import { benefitsSectionStyles as styles } from '../styles/benefitsSectionStyles';
import { useTranslation } from 'react-i18next';

export default function BenefitsSection() {
    const { t } = useTranslation();

    const benefits = [
        {
            id: 1,
            icon: '✅',
            title: t('benefits.verified.title'),
            subtitle: t('benefits.verified.subtitle'),
            description: t('benefits.verified.description')
        },
        {
            id: 2,
            icon: '⏰',
            title: t('benefits.flexible.title'),
            subtitle: t('benefits.flexible.subtitle'),
            description: t('benefits.flexible.description')
        },
        {
            id: 3,
            icon: '💰',
            title: t('benefits.cheaper.title'),
            subtitle: t('benefits.cheaper.subtitle'),
            description: t('benefits.cheaper.description')
        },
        {
            id: 4,
            icon: '💵',
            title: t('benefits.earn.title'),
            subtitle: t('benefits.earn.subtitle'),
            description: t('benefits.earn.description')
        },
        {
            id: 5,
            icon: '🚴‍♂️',
            title: t('benefits.local.title'),
            subtitle: t('benefits.local.subtitle'),
            description: t('benefits.local.description')
        },

        {
            id: 6,
            icon: '👍',
            title: t('benefits.environment.title'),
            subtitle: t('benefits.environment.subtitle'),
            description: t('benefits.environment.description')
        },

    ];

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('home.whyChooseAluko')}</Text>
            <Text style={styles.sectionSubtitle}>{t('home.discoverBenefits')}</Text>

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

