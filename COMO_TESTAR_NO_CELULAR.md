# 📱 Como Testar no Celular Físico - GUIA COMPLETO

## 🎯 Você tem 2 opções para testar no celular:

---

## ✅ OPÇÃO 1: Expo Go (MAIS RÁPIDO - SEM BUILD)

### Vantagens:
- ✅ Não precisa fazer build
- ✅ Testa em 2 minutos
- ✅ Hot-reload funciona
- ✅ Perfeito para desenvolvimento

### Desvantagens:
- ❌ Não testa recursos nativos personalizados
- ❌ Não funciona com bibliotecas nativas customizadas

### 📋 Passo a passo:

1️⃣ **Instale o Expo Go no celular:**
   - Abra a Google Play Store
   - Pesquise "Expo Go"
   - Instale o app

2️⃣ **Inicie o servidor no computador:**
   ```bash
   npx expo start
   ```

3️⃣ **Conecte celular e computador na mesma rede Wi-Fi**

4️⃣ **Escaneie o QR code:**
   - Abra o Expo Go no celular
   - Toque em "Scan QR code"
   - Aponte para o QR code no terminal

5️⃣ **Aguarde o app carregar!**

### 🔧 Se o QR code não funcionar:

```bash
# Use modo tunnel
npx expo start --tunnel
```

---

## ✅ OPÇÃO 2: Development Build (BUILD DO EAS)

### Vantagens:
- ✅ Testa tudo como app nativo
- ✅ Funciona com qualquer biblioteca
- ✅ Pode testar offline
- ✅ Hot-reload funciona quando conectado

### Desvantagens:
- ❌ Precisa baixar e instalar APK
- ❌ Requer conexão para hot-reload

### 📋 Passo a passo:

1️⃣ **Acesse o link do seu build no celular:**
   ```
   https://expo.dev/accounts/escarpellif/projects/aluko
   ```

2️⃣ **Faça login no Expo:**
   - Use as mesmas credenciais do computador

3️⃣ **Baixe o APK:**
   - Toque no build "Android internal distribution build 1.0.0 (1)"
   - Toque em "Download" ou "Install"
   - Confirme o download

4️⃣ **Instale o APK:**
   - Abra o arquivo baixado
   - Se aparecer "Instalar apps de fontes desconhecidas":
     - Vá em Configurações > Segurança
     - Ative "Fontes desconhecidas" para o navegador
   - Instale o app

5️⃣ **IMPORTANTE - Inicie o servidor no computador:**
   ```bash
   npx expo start --dev-client
   ```

6️⃣ **Abra o app no celular:**
   - O app vai procurar automaticamente pelo servidor
   - Se não conectar, digite o IP manualmente:
     - Toque em "Enter URL manually"
     - Digite: `exp://SEU_IP:8081` (exemplo: `exp://192.168.1.100:8081`)

### 🔍 Descobrir o IP do seu computador:

```bash
# No Linux:
hostname -I | awk '{print $1}'

# Ou:
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### 🌐 Celular e Computador devem estar na MESMA rede Wi-Fi!

---

## ✅ OPÇÃO 3: Build de Produção (SEM HOT-RELOAD)

### Quando usar:
- Testar a versão final antes de publicar
- Compartilhar com testadores
- Testar sem precisar do computador

### 📋 Passo a passo:

1️⃣ **Criar build de produção:**
   ```bash
   eas build --platform android --profile production
   ```

2️⃣ **Aguarde 10-15 minutos**

3️⃣ **Baixe o APK no celular:**
   - Acesse: https://expo.dev/accounts/escarpellif/projects/aluko/builds
   - Baixe e instale o APK de produção

4️⃣ **Use o app normalmente (sem conexão com computador)**

---

## 🐛 SOLUCIONANDO O ERRO ATUAL

O erro que você está vendo significa:

**"Unable to load script. Make sure you're running Metro..."**

### ✅ Solução:

1️⃣ **No computador, inicie o servidor:**
   ```bash
   npx expo start --dev-client
   ```

2️⃣ **Certifique-se de que celular e computador estão na MESMA rede Wi-Fi**

3️⃣ **Descubra o IP do seu computador:**
   ```bash
   hostname -I | awk '{print $1}'
   ```
   Exemplo de saída: `192.168.1.100`

4️⃣ **No app do celular:**
   - Toque em "Reload" ou "Go to Home"
   - Se não conectar, toque nos 3 pontinhos (⋮)
   - Toque em "Enter URL manually"
   - Digite: `exp://192.168.1.100:8081` (use SEU IP)

5️⃣ **Aguarde conectar!**

---

## 🎯 RECOMENDAÇÃO PARA VOCÊ

Para testar rapidamente AGORA:

### Use Expo Go (Opção 1):

```bash
# No terminal do computador:
npx expo start

# No celular:
# 1. Instale o Expo Go
# 2. Escaneie o QR code
# 3. Pronto!
```

**Isso vai funcionar em 2 minutos!**

---

## 📊 Comparação Rápida

| Método | Tempo Setup | Hot-Reload | Offline | Melhor Para |
|--------|-------------|------------|---------|-------------|
| **Expo Go** | 2 min | ✅ Sim | ❌ Não | Desenvolvimento rápido |
| **Dev Build** | 15 min | ✅ Sim (conectado) | ⚠️ Parcial | Testar features nativas |
| **Production** | 20 min | ❌ Não | ✅ Sim | Versão final / Testadores |

---

## 🔧 Comandos Úteis

### Ver IP do computador:
```bash
hostname -I | awk '{print $1}'
```

### Verificar se servidor está rodando:
```bash
# Deve aparecer o QR code e o IP
npx expo start
```

### Modo tunnel (se firewall bloquear):
```bash
npx expo start --tunnel
```

### Limpar cache:
```bash
npx expo start -c
```

---

## 🎉 PRÓXIMOS PASSOS

1. **Teste com Expo Go primeiro** (mais rápido)
2. **Se precisar testar mapas/câmera**, use o Development Build
3. **Para versão final**, faça build de produção

**Qual opção você quer usar? Recomendo começar com Expo Go!**
