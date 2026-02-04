#!/bin/bash

# Script para publicar Aluko na Google Play Internal Testing
# Autor: GitHub Copilot
# Data: 30/01/2026

set -e  # Para o script se houver erro

echo "🚀 =========================================="
echo "🚀 PUBLICAÇÃO ALUKO - GOOGLE PLAY"
echo "🚀 =========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta raiz do projeto!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checklist antes de começar:${NC}"
echo ""
echo "1. ✅ Você criou a conta Google Play Console ($25)?"
echo "2. ✅ Você criou o app no Google Play Console?"
echo "3. ✅ Você criou o Service Account no Google Cloud?"
echo "4. ✅ Você baixou o arquivo JSON e colocou como google-service-account.json?"
echo "5. ✅ Você deu permissões ao Service Account no Google Play Console?"
echo ""
read -p "Todos os itens acima estão OK? (s/n): " resposta

if [ "$resposta" != "s" ] && [ "$resposta" != "S" ]; then
    echo -e "${RED}❌ Complete o checklist primeiro!${NC}"
    echo ""
    echo "Consulte o arquivo: GUIA_PUBLICACAO_GOOGLE_PLAY.md"
    exit 1
fi

# Verificar se o arquivo JSON existe
if [ ! -f "google-service-account.json" ]; then
    echo -e "${RED}❌ Erro: Arquivo google-service-account.json não encontrado!${NC}"
    echo ""
    echo "Baixe o arquivo JSON do Service Account e coloque nesta pasta com o nome:"
    echo "  google-service-account.json"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Checklist OK! Iniciando processo...${NC}"
echo ""

# Etapa 1: Verificar se está logado no EAS
echo "🔐 Verificando login no EAS..."
if ! npx eas-cli whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você não está logado no EAS. Fazendo login...${NC}"
    npx eas-cli login
else
    echo -e "${GREEN}✅ Você já está logado no EAS${NC}"
fi

echo ""

# Etapa 2: Build de Produção
echo "🏗️  Iniciando build de PRODUÇÃO..."
echo ""
echo -e "${YELLOW}⏳ Isso pode levar de 15 a 30 minutos...${NC}"
echo ""

npx eas-cli build --platform android --profile production --non-interactive

echo ""
echo -e "${GREEN}✅ Build completado com sucesso!${NC}"
echo ""

# Etapa 3: Perguntar se quer fazer upload agora
echo "📤 Deseja fazer upload para Google Play Internal Testing agora?"
read -p "(s/n): " upload_now

if [ "$upload_now" = "s" ] || [ "$upload_now" = "S" ]; then
    echo ""
    echo "📤 Fazendo upload para Google Play..."
    echo ""

    npx eas-cli submit --platform android --latest --non-interactive

    echo ""
    echo -e "${GREEN}✅ Upload completado!${NC}"
    echo ""
    echo "🎉 Próximos passos:"
    echo "1. Acesse: https://play.google.com/console"
    echo "2. Selecione seu app (Aluko)"
    echo "3. Vá em 'Testing > Internal testing'"
    echo "4. Aprove a nova versão"
    echo "5. Copie o link de teste e envie para testadores"
else
    echo ""
    echo "⏸️  Upload cancelado."
    echo ""
    echo "Para fazer upload depois, execute:"
    echo "  npx eas-cli submit --platform android --latest"
fi

echo ""
echo -e "${GREEN}🎉 =========================================="
echo "🎉 PROCESSO FINALIZADO!"
echo "🎉 ==========================================${NC}"
echo ""
