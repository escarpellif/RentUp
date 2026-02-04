import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { staticContentStyles } from '../styles/screens/staticContentStyles';

export default function StaticContentScreen({ route, navigation }) {
    const { title, content } = route.params;

    return (
        <SafeAreaView style={staticContentStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde */}
            <View style={staticContentStyles.headerContainer}>
                <View style={staticContentStyles.headerTopRow}>
                    <View style={staticContentStyles.leftHeader}>
                        <TouchableOpacity
                            style={staticContentStyles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={staticContentStyles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={staticContentStyles.headerTitle}>{title}</Text>
                    </View>

                    <View style={staticContentStyles.logoContainer}>
                        <Text style={staticContentStyles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={staticContentStyles.scrollContainer}>
                <View style={staticContentStyles.contentCard}>
                    {content}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}



