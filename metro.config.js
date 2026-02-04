const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problemas com react-native-maps no web
config.resolver.sourceExts.push('mjs');

module.exports = config;
