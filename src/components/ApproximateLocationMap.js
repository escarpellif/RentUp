import React from 'react';
import {View, Text } from 'react-native';
import { approximateLocationMapStyles } from '../styles/components/approximateLocationMapStyles';

export default function ApproximateLocationMap({ coordinates, locationApprox }) {
    return (
        <View style={approximateLocationMapStyles.container}>
            <Text style={approximateLocationMapStyles.title}>Approximate location</Text>

            <View style={approximateLocationMapStyles.mapPlaceholder}>
                <View style={approximateLocationMapStyles.circle}>
                    <Text style={approximateLocationMapStyles.circleText}>📍</Text>
                </View>
                <Text style={approximateLocationMapStyles.areaText}>~300m radius area</Text>
            </View>

            {locationApprox && (
                <Text style={approximateLocationMapStyles.locationText}>📍 {locationApprox}</Text>
            )}

            <Text style={approximateLocationMapStyles.disclaimer}>Exact location provided after booking</Text>
        </View>
    );
}



