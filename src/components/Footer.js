import React from 'react';
import { View, Text, TouchableOpacity, Linking, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { footerStyles as styles } from '../styles/footerStyles';
import {
    AboutUsContent,
    FAQsContent,
    UserPolicyContent,
    CancellationContent,
    PrivacyPolicyContent
} from './StaticContents';

export default function Footer({ navigation }) {
    const { t } = useTranslation();

    const openSocialMedia = (platform) => {
        const urls = {
            facebook: 'https://facebook.com/aluko',
            instagram: 'https://instagram.com/aluko',
            tiktok: 'https://tiktok.com/@aluko',
        };

        Linking.openURL(urls[platform]).catch(err =>
            console.error('Error opening social media:', err)
        );
    };

    const openSupportForm = () => {
        navigation.navigate('StaticContent', {
            title: t('footer.support'),
            content: <SupportFormContent />
        });
    };

    return (
        <View style={styles.footerContainer}>
            {/* Social Media Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('footer.followUs')}</Text>
                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => openSocialMedia('facebook')}
                    >
                        <Ionicons name="logo-facebook" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => openSocialMedia('instagram')}
                    >
                        <Ionicons name="logo-instagram" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => openSocialMedia('tiktok')}
                    >
                        <Ionicons name="logo-tiktok" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Links Section */}
            <View style={styles.linksSection}>
                <View style={styles.linksColumn}>
                    <Text style={styles.columnTitle}>{t('footer.company')}</Text>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('StaticContent', {
                            title: t('footer.aboutUs'),
                            content: <AboutUsContent />
                        })}
                    >
                        <Text style={styles.linkText}>{t('footer.aboutUs')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('StaticContent', {
                            title: t('footer.faqs'),
                            content: <FAQsContent />
                        })}
                    >
                        <Text style={styles.linkText}>{t('footer.faqs')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => openSupportForm()}
                    >
                        <Text style={styles.linkText}>{t('footer.support')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.linksColumn}>
                    <Text style={styles.columnTitle}>{t('footer.legal')}</Text>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('StaticContent', {
                            title: t('footer.userPolicy'),
                            content: <UserPolicyContent />
                        })}
                    >
                        <Text style={styles.linkText}>{t('footer.userPolicy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('StaticContent', {
                            title: t('footer.cancellation'),
                            content: <CancellationContent />
                        })}
                    >
                        <Text style={styles.linkText}>{t('footer.cancellation')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('StaticContent', {
                            title: t('footer.privacy'),
                            content: <PrivacyPolicyContent />
                        })}
                    >
                        <Text style={styles.linkText}>{t('footer.privacy')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>ALUKO</Text>
                    <Text style={styles.tagline}>{t('home.subtitle')}</Text>
                </View>

                <View style={styles.copyrightContainer}>
                    <Text style={styles.copyrightText}>
                        © 2025 ALUKO. {t('footer.allRightsReserved')}
                    </Text>
                    <Text style={styles.versionText}>v1.0.0</Text>
                </View>
            </View>
        </View>
    );
}

// Componente do Formulário de Suporte
const SupportFormContent = () => {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [sending, setSending] = React.useState(false);

    const handleSubmit = () => {
        if (!name || !email || !subject || !message) {
            alert(isSpanish
                ? 'Por favor, completa todos los campos'
                : 'Please fill in all fields');
            return;
        }

        setSending(true);

        // Criar mailto link
        const mailtoLink = `mailto:support@aluko.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`
        )}`;

        Linking.openURL(mailtoLink)
            .then(() => {
                alert(isSpanish
                    ? '¡Gracias! Tu mensaje ha sido enviado.'
                    : 'Thank you! Your message has been sent.');
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
            })
            .catch(err => {
                alert(isSpanish
                    ? 'Error al abrir el cliente de correo'
                    : 'Error opening email client');
            })
            .finally(() => setSending(false));
    };


    return (
        <View>
            <Text style={formStyles.title}>
                {isSpanish ? 'Formulario de Soporte' : 'Support Form'}
            </Text>

            <Text style={formStyles.description}>
                {isSpanish
                    ? 'Completa el formulario a continuación y nos pondremos en contacto contigo lo antes posible.'
                    : 'Fill out the form below and we will get back to you as soon as possible.'}
            </Text>

            <Text style={formStyles.label}>
                {isSpanish ? 'Nombre Completo *' : 'Full Name *'}
            </Text>
            <TextInput
                style={formStyles.input}
                value={name}
                onChangeText={setName}
                placeholder={isSpanish ? 'Tu nombre' : 'Your name'}
            />

            <Text style={formStyles.label}>
                {isSpanish ? 'Correo Electrónico *' : 'Email *'}
            </Text>
            <TextInput
                style={formStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={isSpanish ? 'tu@email.com' : 'your@email.com'}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text style={formStyles.label}>
                {isSpanish ? 'Asunto *' : 'Subject *'}
            </Text>
            <TextInput
                style={formStyles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder={isSpanish ? 'Asunto de tu consulta' : 'Subject of your inquiry'}
            />

            <Text style={formStyles.label}>
                {isSpanish ? 'Mensaje *' : 'Message *'}
            </Text>
            <TextInput
                style={[formStyles.input, formStyles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder={isSpanish ? 'Describe tu problema o pregunta...' : 'Describe your problem or question...'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[formStyles.submitButton, sending && formStyles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={sending}
            >
                <Text style={formStyles.submitButtonText}>
                    {sending
                        ? (isSpanish ? 'Enviando...' : 'Sending...')
                        : (isSpanish ? 'Enviar Mensaje' : 'Send Message')}
                </Text>
            </TouchableOpacity>

            <Text style={formStyles.infoText}>
                {isSpanish
                    ? '📧 También puedes enviarnos un email directamente a: support@aluko.com'
                    : '📧 You can also email us directly at: support@aluko.com'}
            </Text>
        </View>
    );
};

const formStyles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#2c4455',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 25,
        color: '#666',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 15,
        color: '#333',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 25,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
});


