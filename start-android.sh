#!/bin/bash

# Script para iniciar o app Android com Expo
# Carrega o NVM e inicia o servidor Expo para Android

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Expo para Android...${NC}"

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Configurar Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Verificar se Node está disponível
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js não encontrado. Instalando...${NC}"
    nvm install --lts
fi

# Verificar se o emulador ou dispositivo está conectado
echo -e "${BLUE}📱 Verificando dispositivos Android...${NC}"
if command -v adb &> /dev/null; then
    adb devices
else
    echo -e "${YELLOW}⚠️  ADB não encontrado. Certifique-se de que o Android Studio está instalado.${NC}"
fi

# Limpar cache se solicitado
if [ "$1" == "--clear" ] || [ "$1" == "-c" ]; then
    echo -e "${BLUE}🧹 Limpando cache...${NC}"
    rm -rf android/
    npx expo start -c
    echo -e "${YELLOW}⏳ Pressione 'a' no terminal do Expo para compilar e instalar no Android${NC}"
else
    echo -e "${GREEN}✨ Compilando e instalando o app...${NC}"
    npm run android
fi
