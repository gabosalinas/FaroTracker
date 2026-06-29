const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'mkv', 'glb', and 'gltf' to the list of asset extensions supported by the packager
config.resolver.assetExts.push('mkv');
config.resolver.assetExts.push('glb');
config.resolver.assetExts.push('gltf');

module.exports = config;
