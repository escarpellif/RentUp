#!/bin/bash

# Script para monitorar o build e baixar o AAB automaticamente

echo "🔍 Monitorando build..."
echo ""

BUILD_ID="8fb48da1-f0e5-4cae-8ac4-d006c76d09ff"

while true; do
    echo "⏳ Verificando status do build..."

    # Verifica o status do build
    STATUS=$(npx eas-cli build:view $BUILD_ID 2>/dev/null | grep "Status" | awk '{print $2}')

    if [ "$STATUS" == "finished" ]; then
        echo ""
        echo "✅ Build completado com sucesso!"
        echo ""
        echo "📥 Baixando arquivo AAB..."
        npx eas-cli build:download $BUILD_ID
        echo ""
        echo "✨ Download concluído!"
        echo ""
        echo "📁 Arquivo AAB salvo na pasta atual"
        echo ""
        echo "🚀 Próximo passo: Fazer upload no Google Play Console"
        echo "   ou executar: npx eas-cli submit --platform android --latest"
        break
    elif [ "$STATUS" == "errored" ] || [ "$STATUS" == "canceled" ]; then
        echo ""
        echo "❌ Build falhou com status: $STATUS"
        echo ""
        echo "Ver logs em: https://expo.dev/accounts/escarpellif/projects/aluko/builds/$BUILD_ID"
        break
    else
        echo "   Status atual: $STATUS"
        echo "   Aguardando... (verificando novamente em 60 segundos)"
        echo ""
        sleep 60
    fi
done
