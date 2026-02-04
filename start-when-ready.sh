#!/bin/bash

# Script que aguarda o emulador estar completamente pronto antes de iniciar o app

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🎯 Aguardando emulador Android estar pronto...${NC}"
echo ""

# Carregar NVM e Android SDK
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verificar se há dispositivos
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${YELLOW}❌ Nenhum emulador detectado!${NC}"
    echo ""
    echo "Por favor, inicie um emulador primeiro:"
    echo "  1. Android Studio → Device Manager → ▶️"
    echo "  OU"
    echo "  emulator -avd Medium_Phone_API_36.1 &"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Emulador detectado!${NC}"

# Aguardar até o boot completar
echo -e "${BLUE}⏳ Aguardando boot completar...${NC}"

MAX_WAIT=120  # 2 minutos
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')

    if [ "$BOOT_COMPLETED" == "1" ]; then
        echo -e "${GREEN}✅ Emulador pronto!${NC}"
        echo ""
        sleep 2  # Aguardar mais 2 segundos para garantir

        # Iniciar o app
        echo -e "${BLUE}🚀 Iniciando seu app...${NC}"
        echo ""
        npx expo start --android
        exit 0
    fi

    echo -ne "\r⏳ Aguardando... ${ELAPSED}s / ${MAX_WAIT}s"
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

echo ""
echo -e "${YELLOW}⚠️  Timeout - emulador demorou muito para iniciar${NC}"
echo ""
echo "Tente:"
echo "  1. Reiniciar o emulador"
echo "  2. Iniciar manualmente: npx expo start"
exit 1
