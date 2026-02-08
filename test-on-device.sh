#!/bin/bash

# Script para testar app no celular conectado via USB

echo "📱 ALUKO - Teste no Dispositivo Android"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se ADB está instalado
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB não encontrado!${NC}"
    echo ""
    echo "Instalando ADB..."
    sudo apt install -y android-tools-adb android-tools-fastboot
fi

# Iniciar servidor ADB
echo -e "${BLUE}🔧 Iniciando servidor ADB...${NC}"
adb start-server > /dev/null 2>&1
sleep 1

# Verificar dispositivos conectados
echo -e "${BLUE}🔍 Procurando dispositivos conectados...${NC}"
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Nenhum dispositivo conectado!${NC}"
    echo ""
    echo "📋 Siga estes passos:"
    echo "1. Conecte o celular via cabo USB"
    echo "2. No celular, vá em Configurações > Sobre o telefone"
    echo "3. Toque 7 vezes em 'Número da versão'"
    echo "4. Volte e entre em 'Opções do desenvolvedor'"
    echo "5. Ative 'Depuração USB'"
    echo "6. Quando aparecer o popup, toque em 'Permitir'"
    echo ""
    echo "Execute este script novamente após conectar o celular."
    exit 1
fi

echo -e "${GREEN}✅ Dispositivo conectado!${NC}"
echo ""

# Mostrar informações do dispositivo
DEVICE_MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
DEVICE_ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')

echo -e "${BLUE}📱 Dispositivo: ${NC}$DEVICE_MODEL"
echo -e "${BLUE}🤖 Android: ${NC}$DEVICE_ANDROID"
echo ""

# Menu de opções
echo "Escolha uma opção:"
echo ""
echo "1) Ver logs do app em tempo real"
echo "2) Ver apenas erros críticos"
echo "3) Capturar log completo de crash"
echo "4) Limpar logs antigos"
echo "5) Verificar se o app está instalado"
echo "6) Desinstalar o app"
echo "7) Abrir o app"
echo "0) Sair"
echo ""
read -p "Opção: " option

case $option in
    1)
        echo -e "${GREEN}📊 Monitorando logs do app...${NC}"
        echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
        echo ""
        adb logcat -c
        adb logcat | grep -i --color=always "aluko\|ReactNativeJS\|ExpoModules\|FATAL\|AndroidRuntime\|ERROR"
        ;;
    2)
        echo -e "${RED}🚨 Monitorando APENAS erros críticos...${NC}"
        echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
        echo ""
        adb logcat -c
        adb logcat *:E *:F | grep -i --color=always "aluko\|com.aluko.app\|FATAL"
        ;;
    3)
        echo -e "${BLUE}📝 Capturando log completo...${NC}"
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        LOGFILE="crash-log-${TIMESTAMP}.txt"

        echo "1. Limpe os logs antigos"
        adb logcat -c

        echo "2. Inicie a captura de log"
        echo -e "${YELLOW}Agora abra o app no celular e aguarde ele crashar${NC}"
        echo -e "${YELLOW}Pressione Ctrl+C quando o crash acontecer${NC}"
        echo ""

        adb logcat > "$LOGFILE"

        echo ""
        echo -e "${GREEN}✅ Log salvo em: $LOGFILE${NC}"
        echo ""
        echo "Últimos 50 erros encontrados:"
        cat "$LOGFILE" | grep -i "fatal\|exception\|error" | tail -50
        ;;
    4)
        echo -e "${BLUE}🧹 Limpando logs antigos...${NC}"
        adb logcat -c
        echo -e "${GREEN}✅ Logs limpos!${NC}"
        ;;
    5)
        echo -e "${BLUE}🔍 Verificando se o app está instalado...${NC}"
        if adb shell pm list packages | grep -q "com.aluko.app"; then
            echo -e "${GREEN}✅ App está instalado${NC}"

            # Mostrar versão
            VERSION=$(adb shell dumpsys package com.aluko.app | grep "versionName" | head -1)
            echo "   $VERSION"
        else
            echo -e "${RED}❌ App NÃO está instalado${NC}"
            echo ""
            echo "Para instalar, baixe o APK do Google Play Console (Internal Testing)"
            echo "e execute: adb install -r aluko.apk"
        fi
        ;;
    6)
        echo -e "${YELLOW}🗑️  Desinstalando o app...${NC}"
        adb uninstall com.aluko.app
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ App desinstalado com sucesso!${NC}"
        else
            echo -e "${RED}❌ Falha ao desinstalar (app pode não estar instalado)${NC}"
        fi
        ;;
    7)
        echo -e "${BLUE}🚀 Abrindo o app...${NC}"
        adb shell monkey -p com.aluko.app 1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ App aberto!${NC}"
            echo ""
            echo "Monitorando logs..."
            sleep 2
            adb logcat -c
            adb logcat | grep -i --color=always "aluko\|ReactNativeJS\|FATAL\|ERROR"
        else
            echo -e "${RED}❌ Falha ao abrir o app${NC}"
            echo "Certifique-se de que o app está instalado"
        fi
        ;;
    0)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac
