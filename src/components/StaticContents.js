import React from 'react';
import {View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { staticContentsStyles } from '../styles/components/staticContentsStyles';

export const AboutUsContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    return (
        <View>
            {/* Logo e Título */}
            <View style={staticContentsStyles.headerContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={staticContentsStyles.logo}
                    resizeMode="contain"
                />
                <Text style={staticContentsStyles.brandName}>ALUKO</Text>
            </View>

            <Text style={staticContentsStyles.pageTitle}>
                {isSpanish ? 'Nuestra Misión' : 'Our Mission'}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'Crear un mundo más sostenible donde el acceso es más importante que la propiedad, reduciendo el consumo excesivo y maximizando el uso de los recursos existentes.'
                    : 'Create a more sustainable world where access is more important than ownership, reducing excessive consumption and maximizing the use of existing resources.'}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'ALUKO es una plataforma revolucionaria de economía colaborativa que conecta a personas que necesitan artículos temporalmente con aquellas que tienen artículos sin usar.'
                    : 'ALUKO is a revolutionary collaborative economy platform that connects people who need items temporarily with those who have unused items.'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Nuestros Valores' : 'Our Values'}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: '#333' }}>
                • {isSpanish ? 'Confianza y Seguridad' : 'Trust and Security'}{'\n'}
                • {isSpanish ? 'Sostenibilidad' : 'Sustainability'}{'\n'}
                • {isSpanish ? 'Comunidad' : 'Community'}{'\n'}
                • {isSpanish ? 'Innovación' : 'Innovation'}{'\n'}
                • {isSpanish ? 'Transparencia' : 'Transparency'}
            </Text>
        </View>
    );
};

export const FAQsContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    const faqs = isSpanish ? [
        {
            q: '¿Cómo funciona ALUKO?',
            a: 'ALUKO conecta personas que quieren alquilar artículos con propietarios que desean rentabilizar sus pertenencias. Simplemente regístrate, publica tus artículos o busca lo que necesitas.'
        },
        {
            q: '¿Es seguro alquilar en ALUKO?',
            a: 'Sí, todos los usuarios pasan por un proceso de verificación de identidad. Además, cada transacción está protegida por nuestro sistema de depósito de seguridad.'
        },
        {
            q: '¿Qué pasa si el artículo se daña?',
            a: 'Cada alquiler requiere un depósito de seguridad que cubre posibles daños. El propietario puede retener el depósito si el artículo es devuelto dañado.'
        },
        {
            q: '¿Cómo se paga?',
            a: 'Los pagos se realizan de forma segura a través de la plataforma. El propietario recibe el pago después de confirmar la entrega del artículo.'
        },
        {
            q: '¿Cuánto cobra ALUKO?',
            a: 'ALUKO cobra una tarifa de servicio del 18% sobre el precio de alquiler para mantener la plataforma segura y funcionando.'
        }
    ] : [
        {
            q: 'How does ALUKO work?',
            a: 'ALUKO connects people who want to rent items with owners who want to monetize their belongings. Simply sign up, post your items or search for what you need.'
        },
        {
            q: 'Is it safe to rent on ALUKO?',
            a: 'Yes, all users go through an identity verification process. Additionally, each transaction is protected by our security deposit system.'
        },
        {
            q: 'What happens if the item gets damaged?',
            a: 'Each rental requires a security deposit that covers potential damages. The owner can retain the deposit if the item is returned damaged.'
        },
        {
            q: 'How do I pay?',
            a: 'Payments are made securely through the platform. The owner receives payment after confirming item delivery.'
        },
        {
            q: 'How much does ALUKO charge?',
            a: 'ALUKO charges an 18% service fee on the rental price to keep the platform safe and running.'
        }
    ];

    return (
        <View>
            {/* Logo e Título */}
            <View style={staticContentsStyles.headerContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={staticContentsStyles.logo}
                    resizeMode="contain"
                />
                <Text style={staticContentsStyles.brandName}>ALUKO</Text>
            </View>

            <Text style={staticContentsStyles.pageTitle}>
                {isSpanish ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </Text>

            {faqs.map((faq, index) => (
                <View key={index} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#10B981' }}>
                        {faq.q}
                    </Text>
                    <Text style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                        {faq.a}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export const UserPolicyContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    return (
        <View>
            {/* Logo e Título */}
            <View style={staticContentsStyles.headerContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={staticContentsStyles.logo}
                    resizeMode="contain"
                />
                <Text style={staticContentsStyles.brandName}>ALUKO</Text>
            </View>

            <Text style={staticContentsStyles.pageTitle}>
                {isSpanish ? 'Política de Usuario' : 'User Policy'}
            </Text>

            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'Al usar ALUKO, aceptas cumplir con las siguientes normas:'
                    : 'By using ALUKO, you agree to comply with the following rules:'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                1. {isSpanish ? 'Verificación de Identidad' : 'Identity Verification'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'Todos los usuarios deben verificar su identidad antes de publicar artículos o realizar alquileres.'
                    : 'All users must verify their identity before posting items or making rentals.'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                2. {isSpanish ? 'Artículos Prohibidos' : 'Prohibited Items'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                {isSpanish
                    ? 'Está prohibido publicar: armas, drogas, artículos robados, medicamentos, o cualquier artículo ilegal.'
                    : 'Posting is prohibited: weapons, drugs, stolen items, medications, or any illegal items.'}
            </Text>
        </View>
    );
};

export const CancellationContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    return (
        <View>
            {/* Logo e Título */}
            <View style={staticContentsStyles.headerContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={staticContentsStyles.logo}
                    resizeMode="contain"
                />
                <Text style={staticContentsStyles.brandName}>ALUKO</Text>
            </View>

            <Text style={staticContentsStyles.pageTitle}>
                {isSpanish ? 'Política de Cancelación' : 'Cancellation Policy'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Cancelación por el Arrendatario' : 'Cancellation by Renter'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, marginBottom: 15, color: '#333' }}>
                • {isSpanish ? 'Más de 48h antes: Reembolso completo' : 'More than 48h before: Full refund'}{'\n'}
                • {isSpanish ? '24-48h antes: Reembolso del 50%' : '24-48h before: 50% refund'}{'\n'}
                • {isSpanish ? 'Menos de 24h: Sin reembolso' : 'Less than 24h: No refund'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Cancelación por el Propietario' : 'Cancellation by Owner'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'Si el propietario cancela después de la confirmación, el arrendatario recibe un reembolso completo y el propietario puede recibir una penalización.'
                    : 'If the owner cancels after confirmation, the renter receives a full refund and the owner may receive a penalty.'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Proceso de Reembolso' : 'Refund Process'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                {isSpanish
                    ? 'Los reembolsos se procesan en 5-7 días hábiles y se acreditan al método de pago original.'
                    : 'Refunds are processed within 5-7 business days and credited to the original payment method.'}
            </Text>
        </View>
    );
};

export const PrivacyContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    return (
        <View>
            {/* Logo e Título */}
            <View style={staticContentsStyles.headerContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={staticContentsStyles.logo}
                    resizeMode="contain"
                />
                <Text style={staticContentsStyles.brandName}>ALUKO</Text>
            </View>

            <Text style={staticContentsStyles.pageTitle}>
                {isSpanish ? 'Política de Privacidad' : 'Privacy Policy'}
            </Text>

            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'En ALUKO, protegemos tu privacidad y tus datos personales.'
                    : 'At ALUKO, we protect your privacy and personal data.'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Datos que Recopilamos' : 'Data We Collect'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, marginBottom: 15, color: '#333' }}>
                • {isSpanish ? 'Información de registro (nombre, email)' : 'Registration information (name, email)'}{'\n'}
                • {isSpanish ? 'Documentos de verificación' : 'Verification documents'}{'\n'}
                • {isSpanish ? 'Información de pago' : 'Payment information'}{'\n'}
                • {isSpanish ? 'Historial de transacciones' : 'Transaction history'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Cómo Usamos tus Datos' : 'How We Use Your Data'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, marginBottom: 15, color: '#333' }}>
                {isSpanish
                    ? 'Usamos tus datos únicamente para facilitar transacciones, verificar identidades y mejorar nuestros servicios.'
                    : 'We use your data only to facilitate transactions, verify identities, and improve our services.'}
            </Text>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#10B981' }}>
                {isSpanish ? 'Seguridad' : 'Security'}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#333' }}>
                {isSpanish
                    ? 'Utilizamos encriptación SSL y medidas de seguridad avanzadas para proteger tus datos.'
                    : 'We use SSL encryption and advanced security measures to protect your data.'}
            </Text>
        </View>
    );
};

// Estilos compartilhados para os headers


