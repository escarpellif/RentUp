#!/bin/bash

# Guia Passo a Passo - Conectar Celular

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📱 PASSO A PASSO - Conectar Celular via USB                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ PASSO 1: Revogar Autorizações Antigas"
echo "─────────────────────────────────────────"
echo "No celular:"
echo "1. Toque em 'Revoke USB debugging authorizations'"
echo "2. Confirme a ação"
echo ""
read -p "Pressione ENTER quando concluir este passo..."
echo ""

echo "✅ PASSO 2: Desconectar e Reconectar"
echo "────────────────────────────────────"
echo "1. DESCONECTE o cabo USB do celular"
echo "2. Aguarde 5 segundos"
echo ""
read -p "Pressione ENTER quando desconectar..."
echo ""
echo "3. RECONECTE o cabo USB"
echo ""
read -p "Pressione ENTER quando reconectar..."
echo ""

echo "✅ PASSO 3: Mudar Modo USB"
echo "──────────────────────────"
echo "No celular:"
echo "1. Puxe a barra de notificações de cima para baixo"
echo "2. Procure por 'Carregando via USB' ou 'USB conectado'"
echo "3. Toque nesta notificação"
echo "4. Mude para: 'Transferência de arquivos' ou 'MTP'"
echo ""
read -p "Pressione ENTER quando mudar o modo..."
echo ""

echo "🔍 Verificando conexão..."
adb kill-server > /dev/null 2>&1
adb start-server > /dev/null 2>&1
sleep 2

DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo ""
    echo "❌ Ainda não conectado."
    echo ""
    echo "📱 O POPUP DEVE APARECER AGORA NO CELULAR!"
    echo ""
    echo "Procure por uma mensagem como:"
    echo "┌──────────────────────────────────────┐"
    echo "│  Permitir depuração USB?             │"
    echo "│                                      │"
    echo "│  ☑ Sempre permitir neste computador │"
    echo "│                                      │"
    echo "│  [Cancelar]        [Permitir]        │"
    echo "└──────────────────────────────────────┘"
    echo ""
    read -p "Toque em 'Permitir' e pressione ENTER aqui..."

    sleep 2
    adb devices

else
    echo ""
    echo "✅ SUCESSO! Celular conectado!"
    echo ""
    adb devices
    echo ""
    echo "🚀 Agora você pode:"
    echo "   ./test-on-device.sh"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
