import 'dotenv/config';

export default {
  expo: {
    name: "ALUKO - Alquila y Renta",
    slug: "aluko",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "aluko",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.aluko.app",
      infoPlist: {
        NSCameraUsageDescription: "Necesitamos acceder a la cámara para tomar selfies para la verificación.",
        NSPhotoLibraryUsageDescription: "Necesitamos acessar suas fotos para que você possa enviar documentos.",
        NSPhotoLibraryAddUsageDescription: "Precisamos de permissão para salvar imagens, se necessário."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      package: "com.aluko.app",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/images/splash-icon.png",
          imageWidth: 200
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    // 🔒 VARIÁVEIS DE AMBIENTE SEGURAS
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "9e985202-96a5-4a85-856e-754b15dc7881"
      }
    }
  }
};

