#!/bin/bash

# Script para capturar logs do app de QUALQUER forma

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔍 CAPTURAR LOGS DO APP ALUKO - Todas as Formas              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Escolha o método:"
echo ""
echo "1) Usar Android Studio Logcat (RECOMENDADO - mais fácil)"
echo "2) Usar ADB no terminal (direto)"
echo "3) Ver instruções para Google Play Console (crashes automáticos)"
echo "0) Sair"
echo ""
read -p "Opção: " option

case $option in
    1)
        echo -e "${GREEN}📱 ANDROID STUDIO LOGCAT${NC}"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "✅ PASSO A PASSO:"
        echo ""
        echo "1️⃣  Abra o Android Studio"
        echo "    - Procure 'Android Studio' no menu de aplicativos"
        echo "    - Ou execute: android-studio"
        echo ""
        echo "2️⃣  Abra o Logcat"
        echo "    - Menu: View → Tool Windows → Logcat"
        echo "    - Ou clique na aba 'Logcat' na parte inferior"
        echo ""
        echo "3️⃣  Conecte o celular via USB"
        echo "    - No celular, puxe a barra de notificações"
        echo "    - Toque em 'Carregando via USB'"
        echo "    - Mude para: 'Transferência de arquivos'"
        echo ""
        echo "4️⃣  No Logcat:"
        echo "    - Selecione seu dispositivo no dropdown superior"
        echo "    - No filtro, digite: package:com.aluko.app"
        echo "    - Clique no ícone 'Clear' para limpar logs antigos"
        echo ""
        echo "5️⃣  Abra o app no celular"
        echo "    - Os logs aparecerão EM TEMPO REAL"
        echo "    - Erros aparecem em VERMELHO"
        echo ""
        echo "6️⃣  Quando o app crashar:"
        echo "    - Copie TODO o texto em vermelho"
        echo "    - Me envie!"
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo ""
        read -p "Pressione ENTER para abrir o Android Studio..."

        # Tentar abrir Android Studio
        if command -v android-studio &> /dev/null; then
            android-studio &
            echo -e "${GREEN}✅ Android Studio abrindo...${NC}"
        elif command -v studio.sh &> /dev/null; then
            studio.sh &
            echo -e "${GREEN}✅ Android Studio abrindo...${NC}"
        else
            echo -e "${YELLOW}⚠️  Abra o Android Studio manualmente${NC}"
        fi

        echo ""
        echo "Aguardando você configurar o Logcat..."
        echo ""
        ;;

    2)
        echo -e "${BLUE}🖥️  USAR ADB NO TERMINAL${NC}"
        echo "═══════════════════════════════════════════════════════"
        echo ""

        # Verificar se o celular está conectado
        echo "Verificando conexão do celular..."
        adb devices

        DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

        if [ "$DEVICES" -eq 0 ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Celular não autorizado ainda${NC}"
            echo ""
            echo "MAS você ainda pode ver os logs!"
            echo ""
            echo "No celular:"
            echo "1. Puxe a barra de notificações"
            echo "2. Toque em 'Carregando via USB'"
            echo "3. Mude para: 'Transferência de arquivos'"
            echo ""
            read -p "Pressione ENTER quando fizer isso..."
            echo ""
        fi

        echo -e "${GREEN}Iniciando captura de logs...${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚀 Agora ABRA O APP NO CELULAR"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Os logs aparecerão abaixo:"
        echo ""
        echo "Pressione Ctrl+C para parar quando o app crashar"
        echo ""
        sleep 3

        # Limpar logs antigos
        adb logcat -c 2>/dev/null

        # Capturar logs
        adb logcat | grep -i --color=always "aluko\|com.aluko.app\|ReactNativeJS\|FATAL\|AndroidRuntime.*Exception"
        ;;

    3)
        echo -e "${BLUE}☁️  GOOGLE PLAY CONSOLE - Crash Reports${NC}"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "✅ VANTAGENS:"
        echo "  - Crashes reportados AUTOMATICAMENTE"
        echo "  - Não precisa de cabo USB"
        echo "  - Não precisa de ADB"
        echo "  - Stack trace completo"
        echo ""
        echo "📋 COMO USAR:"
        echo ""
        echo "1️⃣  Adicione testadores no Play Console:"
        echo "    - Google Play Console"
        echo "    - Testing → Internal testing"
        echo "    - Manage testers"
        echo "    - Adicione seu email"
        echo ""
        echo "2️⃣  No celular:"
        echo "    - Abra o link de Internal Testing"
        echo "    - Toque em 'Become a tester'"
        echo "    - Vá na Play Store"
        echo "    - Baixe o ALUKO"
        echo "    - Teste o app"
        echo ""
        echo "3️⃣  Se o app crashar:"
        echo "    - Play Console → Quality → Android vitals"
        echo "    - Crashes & ANRs"
        echo "    - Você verá o crash report completo!"
        echo ""
        echo "4️⃣  Me envie o crash report"
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "URL do Play Console:"
        echo "https://play.google.com/console/developers/9013071098662386798/app/4975152165766028097/quality/crashes"
        echo ""
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

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 DICA: O método mais fácil é o Android Studio Logcat (opção 1)"
echo ""
