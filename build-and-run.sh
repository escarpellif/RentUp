#!/bin/bash

# Script para fazer build de desenvolvimento e executar o app no Android

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔨 Build de Desenvolvimento - ALUKO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Carregar Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verificar se o emulador está rodando
echo -e "${BLUE}📱 Verificando emulador...${NC}"
DEVICES=$(adb devices | grep -c "device$")

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}❌ Nenhum emulador detectado!${NC}"
    echo ""
    echo "Por favor, inicie o emulador primeiro:"
    echo "  emulator -avd Medium_Phone_API_36.1 &"
    echo ""
    echo "Ou abra no Android Studio."
    exit 1
fi

echo -e "${GREEN}✅ Emulador detectado!${NC}"
echo ""

# Verificar se já existe a pasta android/
if [ ! -d "android" ]; then
    echo -e "${BLUE}🔧 Gerando arquivos nativos Android...${NC}"
    npx expo prebuild --platform android

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao gerar arquivos nativos!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Arquivos nativos gerados!${NC}"
    echo ""
else
    echo -e "${YELLOW}ℹ️  Pasta android/ já existe. Pulando prebuild.${NC}"
    echo -e "${YELLOW}   Se quiser rebuildar do zero, execute: npx expo prebuild --clean${NC}"
    echo ""
fi

# Verificar se o app já está instalado
echo -e "${BLUE}📦 Verificando se o app já está instalado...${NC}"
APP_INSTALLED=$(adb shell pm list packages | grep -c "com.aluko.app")

if [ "$APP_INSTALLED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  App já instalado. Desinstalando versão antiga...${NC}"
    adb uninstall com.aluko.app
    echo -e "${GREEN}✅ Desinstalado!${NC}"
    echo ""
fi

# Build e instalar
echo -e "${BLUE}🔨 Fazendo build do APK...${NC}"
echo -e "${YELLOW}⏳ Isso pode demorar 5-10 minutos na primeira vez...${NC}"
echo ""

cd android

# Tornar gradlew executável
chmod +x gradlew

# Build e instalar
./gradlew installDebug

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Erro ao fazer build!${NC}"
    echo ""
    echo "Tente:"
    echo "  1. Limpar: ./gradlew clean"
    echo "  2. Rebuildar: npx expo prebuild --clean --platform android"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}✅ Build instalado com sucesso!${NC}"
echo ""

# Iniciar Metro Bundler
echo -e "${BLUE}🚀 Iniciando Metro Bundler...${NC}"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
echo ""

npx expo start --dev-client
