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
      versionCode: 12,
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
      output: "single",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/images/splash-icon.png",
          imageWidth: 200
        }
      ]
    ],
    // 🔒 VARIÁVEIS DE AMBIENTE SEGURAS
    extra: {
      // Estas variáveis vêm do eas.json durante o build
      // e do .env durante o desenvolvimento local
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://fvhnkwxvxnsatqmljnxu.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aG5rd3h2eG5zYXRxbWxqbnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTgwNzksImV4cCI6MjA3NzgzNDA3OX0.TmV3OI1OitcdLvFcGYTm2hclZ8aI-2zwtsI8Ar6GQaU",
      eas: {
        projectId: "9e985202-96a5-4a85-856e-754b15dc7881"
      }
    }
  }
};

