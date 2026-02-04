#!/bin/bash

# Script para configurar o ambiente Android completo
# Este script configura o Android SDK e cria um emulador se necessário

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔧 Configuração do Ambiente Android${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Configurar variáveis de ambiente
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Verificar se o Android SDK está instalado
if [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ Android SDK não encontrado em: $ANDROID_HOME${NC}"
    echo -e "${YELLOW}Por favor, instale o Android Studio primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Android SDK encontrado: $ANDROID_HOME${NC}"

# Verificar adb
if command -v adb &> /dev/null; then
    echo -e "${GREEN}✅ ADB disponível: $(adb --version | head -1)${NC}"
else
    echo -e "${RED}❌ ADB não encontrado${NC}"
    exit 1
fi

# Listar emuladores
echo ""
echo -e "${BLUE}📱 Verificando emuladores disponíveis...${NC}"
AVDS=$(emulator -list-avds)

if [ -z "$AVDS" ]; then
    echo -e "${YELLOW}⚠️  Nenhum emulador encontrado!${NC}"
    echo ""
    echo -e "${BLUE}Para criar um emulador:${NC}"
    echo ""
    echo "1. Abra o Android Studio"
    echo "2. Clique em 'More Actions' → 'Virtual Device Manager'"
    echo "3. Clique em 'Create Device'"
    echo "4. Selecione um dispositivo (recomendado: Pixel 5)"
    echo "5. Selecione uma imagem de sistema (recomendado: API 33 - Android 13)"
    echo "6. Clique em 'Finish'"
    echo ""
    echo -e "${BLUE}Ou use o avdmanager via linha de comando:${NC}"
    echo ""
    echo "# Instalar imagem do sistema (se necessário)"
    echo "sdkmanager \"system-images;android-33;google_apis_playstore;x86_64\""
    echo ""
    echo "# Criar AVD"
    echo "avdmanager create avd -n Pixel_5_API_33 -k \"system-images;android-33;google_apis_playstore;x86_64\" -d pixel_5"
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ Emuladores encontrados:${NC}"
    echo "$AVDS"
    echo ""

    # Perguntar se quer iniciar um emulador
    read -p "Deseja iniciar um emulador agora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Pegar primeiro emulador da lista
        FIRST_AVD=$(echo "$AVDS" | head -1)
        echo -e "${BLUE}🚀 Iniciando emulador: $FIRST_AVD${NC}"
        emulator -avd "$FIRST_AVD" &
        echo -e "${GREEN}✅ Emulador iniciando em background...${NC}"
        echo -e "${YELLOW}Aguarde alguns segundos para ele carregar completamente.${NC}"
    fi
fi

# Verificar dispositivos conectados
echo ""
echo -e "${BLUE}📱 Dispositivos Android conectados:${NC}"
adb devices

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Configuração completa!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Para testar seu app:${NC}"
echo "  ./start-android.sh"
echo ""
