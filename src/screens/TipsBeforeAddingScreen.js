import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function TipsBeforeAddingScreen({ navigation }) {
    const tips = [
        {
            icon: '💔',
            title: 'Valor Sentimental',
            description: 'No anuncies cosas con valor sentimental',
            color: '#FF6B6B',
        },
        {
            icon: '🔨',
            title: 'Artículos Frágiles',
            description: 'No anuncies artículos que se desgasten fácilmente o sean demasiado frágiles',
            color: '#FFB84D',
        },
        {
            icon: '🧴',
            title: 'Higiene Personal',
            description: 'No anuncies nada que dependa de la higiene personal',
            color: '#4ECDC4',
        },
        {
            icon: '🔧',
            title: 'Mantenimiento Constante',
            description: 'No anuncies artículos que requieran mantenimiento constante',
            color: '#95E1D3',
        },
        {
            icon: '⚠️',
            title: 'Seguridad',
            description: 'No anuncies algo que pueda causar accidentes si se usa mal',
            color: '#F38181',
        },
        {
            icon: '📱',
            title: 'Datos Personales',
            description: 'No anuncies dispositivos electrónicos que guarden datos personales',
            color: '#AA96DA',
        },
        {
            icon: '💸',
            title: 'Artículos Irreemplazables',
            description: 'No anuncies algo que no podrías reemplazar fácilmente si se rompe',
            color: '#FCBAD3',
        },
    ];

    const handleContinue = () => {
        navigation.navigate('AddItemForm');
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />
            
            {/* Header con Gradiente */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerIcon}>💡</Text>
                    <Text style={styles.headerTitle}>Antes de Anunciar</Text>
                    <Text style={styles.headerSubtitle}>Consejos importantes para ti</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Mensaje de bienvenida */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>¡Un momento! ✋</Text>
                    <Text style={styles.welcomeText}>
                        Para mantener una comunidad segura y confiable, por favor revisa estas recomendaciones antes de publicar tu artículo.
                    </Text>
                </View>

                {/* Cards de Dicas */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.sectionTitle}>❌ Evita Anunciar:</Text>
                    {tips.map((tip, index) => (
                        <View key={index} style={[styles.tipCard, { borderLeftColor: tip.color }]}>
                            <View style={[styles.iconContainer, { backgroundColor: tip.color + '20' }]}>
                                <Text style={styles.tipIcon}>{tip.icon}</Text>
                            </View>
                            <View style={styles.tipContent}>
                                <Text style={styles.tipTitle}>{tip.title}</Text>
                                <Text style={styles.tipDescription}>{tip.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Card de Recomendação */}
                <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>✅</Text>
                    <Text style={styles.recommendationTitle}>¿Qué SÍ puedes anunciar?</Text>
                    <Text style={styles.recommendationText}>
                        • Herramientas y equipos en buen estado{'\n'}
                        • Artículos electrónicos funcionales{'\n'}
                        • Equipamiento deportivo{'\n'}
                        • Muebles y decoración{'\n'}
                        • Vehículos con documentación{'\n'}
                        • Cualquier cosa que esté bien cuidada y sea segura
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Botón Flotante de Continuar */}
            <View style={styles.floatingButtonContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.continueButtonGradient}
                    >
                        <Text style={styles.continueButtonText}>Entendido, Continuar</Text>
                        <Text style={styles.continueButtonIcon}>→</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerGradient: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backArrow: {
        fontSize: 22,
        color: '#fff',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 50,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    scrollContent: {
        flex: 1,
    },
    welcomeCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    tipsContainer: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 10,
    },
    tipCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tipIcon: {
        fontSize: 24,
    },
    tipContent: {
        flex: 1,
        justifyContent: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    recommendationCard: {
        backgroundColor: '#E8F5E9',
        margin: 20,
        marginTop: 10,
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
    },
    recommendationIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    recommendationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 12,
    },
    recommendationText: {
        fontSize: 15,
        color: '#1B5E20',
        lineHeight: 24,
        textAlign: 'left',
        width: '100%',
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    continueButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    continueButtonIcon: {
        fontSize: 20,
        color: '#fff',
    },
});

