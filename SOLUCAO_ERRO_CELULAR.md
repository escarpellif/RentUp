# 🚨 SOLUÇÃO PARA O ERRO NO CELULAR

## ❌ Erro que você está vendo:

```
Unable to load script.
Make sure you're running Metro or that your bundle 'index.android.bundle' is packaged correctly for release.
```

---

## ✅ SOLUÇÃO RÁPIDA

### O problema:
Você instalou o **Development Build** no celular, mas ele precisa se conectar ao servidor de desenvolvimento no seu computador.

### A solução em 3 passos:

---

## 🔧 PASSO 1: Inicie o servidor no computador

```bash
cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko
npx expo start --dev-client
```

**Aguarde aparecer:**
- ✅ QR code
- ✅ Metro bundler rodando
- ✅ Mensagem "Waiting for device to connect"

---

## 📱 PASSO 2: Conecte o celular ao servidor

### Opção A: Conexão automática (MAIS FÁCIL)

1. **Certifique-se que celular e computador estão na MESMA rede Wi-Fi**
2. **Abra o app no celular** (o que você já instalou)
3. **O app vai conectar automaticamente**
4. **Aguarde carregar**

### Opção B: Conexão manual (SE NÃO CONECTAR SOZINHO)

1. **No app do celular:**
   - Toque em "Enter URL manually" ou nos 3 pontinhos (⋮)
   
2. **Digite o endereço:**
   ```
   exp://192.168.18.144:8081
   ```
   ☝️ **Este é o IP do seu computador!**

3. **Toque em "Connect"**

4. **Aguarde carregar**

---

## 🎯 PASSO 3: Verifique se está funcionando

Você deve ver:
- ✅ Tela de login/home do app
- ✅ No terminal do computador: "Connected to device"

---

## ⚡ ALTERNATIVA MAIS RÁPIDA: Use Expo Go

Se quiser testar AGORA sem complicação:

### 1️⃣ No computador:
```bash
npx expo start
```

### 2️⃣ No celular:
1. Instale o **Expo Go** da Google Play Store
2. Abra o Expo Go
3. Escaneie o QR code que apareceu no terminal
4. Pronto! App vai abrir em segundos

**Isso funciona SEM precisar do development build!**

---

## 🔍 Troubleshooting

### Se ainda não conectar:

#### 1. Verifique firewall:
```bash
# Libere a porta 8081
sudo ufw allow 8081
```

#### 2. Use modo tunnel:
```bash
npx expo start --dev-client --tunnel
```

#### 3. Reinicie tudo:
```bash
# Pare o servidor (Ctrl+C)
# Limpe o cache
npx expo start --dev-client --clear

# No celular, feche e abra o app novamente
```

#### 4. Verifique se estão na mesma rede:

**No computador:**
```bash
ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1
```
Resultado: `192.168.18.144`

**No celular:**
- Vá em Configurações > Wi-Fi
- Toque na rede conectada
- Veja o IP (deve começar com `192.168.18.xxx`)

Se os IPs **não começarem igual**, vocês estão em redes diferentes!

---

## 📊 Comparação: Development Build vs Expo Go

| | Development Build | Expo Go |
|---|---|---|
| **Setup** | ❌ Complexo | ✅ Simples |
| **Tempo** | ❌ 15 min | ✅ 2 min |
| **Precisa servidor** | ✅ Sim | ✅ Sim |
| **Features nativas** | ✅ Todas | ⚠️ Limitadas |
| **Melhor para** | Teste final | Desenvolvimento |

---

## 🎯 RECOMENDAÇÃO

Para testar **AGORA**:
1. Use **Expo Go** (mais rápido)
2. Depois teste com Development Build

Para testar **versão final**:
1. Faça build de produção:
   ```bash
   eas build --platform android --profile production
   ```
2. Baixe e instale o APK
3. Use sem precisar do computador

---

## ✨ RESUMO

### Para usar o Development Build que você já instalou:

```bash
# No computador:
npx expo start --dev-client

# No celular:
# Abra o app e conecte em:
# exp://192.168.18.144:8081
```

### Para usar Expo Go (mais fácil):

```bash
# No computador:
npx expo start

# No celular:
# Instale Expo Go e escaneie o QR code
```

---

## 🎉 Pronto!

Escolha uma das opções acima e seu app vai funcionar! 

**Dica:** Comece com Expo Go para testar rápido, depois use o Development Build para testar features específicas.
