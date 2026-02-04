# 🔧 COMO RECOMPILAR O APK COM AS CORREÇÕES

## 🔴 **POR QUE O ERRO CONTINUA?**

O APK que você instalou no celular foi **compilado ANTES** das correções que fiz no código.

**As correções estão no código do computador, mas NÃO estão no APK do celular!**

## ✅ **SOLUÇÃO: RECOMPILAR O APK**

### **Opção 1: Usar EAS Build (Recomendado)**

Execute no terminal do Ubuntu:

```bash
cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko

# 1. Fazer login no EAS (se ainda não fez)
npx eas-cli login

# 2. Iniciar novo build
npx eas-cli build --platform android --profile development

# 3. Aguardar o build completar (15-30 minutos)
# O EAS vai mostrar um link para acompanhar

# 4. Quando terminar, baixar o novo APK
# Acesse o link que apareceu e baixe o arquivo .apk

# 5. Transferir APK para o celular
# Copie o arquivo .apk para o celular via cabo USB ou Google Drive

# 6. Instalar no celular
# Desinstale o APK antigo primeiro!
# Depois instale o novo APK
```

### **Opção 2: Testar via Expo Development Server (Mais Rápido)**

**ATENÇÃO:** Você ainda pode usar o APK que já tem, mas precisa conectá-lo ao servidor Expo:

```bash
# 1. Inicie o servidor Expo no Ubuntu
npm start

# 2. O QR code vai aparecer no terminal

# 3. No celular, abra o APK que você instalou

# 4. Quando o app abrir, ele vai pedir para escanear o QR code

# 5. Escaneie o QR code que apareceu no terminal do Ubuntu

# 6. O app vai RECARREGAR com o código NOVO do computador!
```

**Esta opção 2 é mais rápida porque:**
- ✅ Não precisa recompilar o APK
- ✅ O APK development build baixa o código JavaScript do servidor Expo
- ✅ Mudanças no código aparecem instantaneamente

## 🎯 **QUAL OPÇÃO ESCOLHER?**

### **Use Opção 2 (Expo Server) se:**
- ✅ Você quer testar AGORA
- ✅ Está fazendo mudanças frequentes no código
- ✅ Seu computador e celular estão na mesma rede Wi-Fi

### **Use Opção 1 (Recompilar APK) se:**
- ✅ Quer um APK standalone (não precisa do servidor)
- ✅ Quer compartilhar o APK com outras pessoas
- ✅ Fez mudanças em código nativo (não é o caso agora)

## 📱 **COMO USAR A OPÇÃO 2 (RECOMENDADO AGORA):**

### **Passo a passo detalhado:**

1. **No Ubuntu, abra o terminal e execute:**
   ```bash
   cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko
   npm start
   ```

2. **Aguarde aparecer o QR code no terminal**

3. **No celular Android:**
   - Abra o app Aluko (o APK que você instalou)
   - Quando aparecer a tela de erro, **FECHE O APP COMPLETAMENTE**
   - Abra novamente
   - Na tela inicial, deve aparecer uma opção para escanear QR code
   - OU pressione o botão de menu (3 pontinhos) e escolha "Scan QR Code"

4. **Escaneie o QR code que apareceu no terminal do Ubuntu**

5. **O app vai conectar ao servidor e RECARREGAR com as correções!** 🎉

## 🔍 **COMO VER OS LOGS NO ANDROID:**

### **Opção 1: Via ADB (Android Debug Bridge)**

```bash
# 1. Conecte o celular ao computador via USB

# 2. No celular, habilite "Depuração USB" nas opções de desenvolvedor

# 3. No Ubuntu, instale ADB (se ainda não tem)
sudo apt install adb

# 4. Veja os logs em tempo real
adb logcat | grep -i "DEBUG\|ERROR\|Aluko"
```

### **Opção 2: Shake para abrir Dev Menu**

1. Com o app aberto, **SACUDA O CELULAR**
2. Vai abrir um menu de desenvolvedor
3. Toque em "Remote JS Debugging"
4. Vai abrir o Chrome no computador com os logs

### **Opção 3: Via Metro Bundler (quando usando npm start)**

Quando você executa `npm start`, os logs aparecem **AUTOMATICAMENTE** no terminal do Ubuntu!

## ⚠️ **IMPORTANTE:**

**As correções que fiz SÓ VÃO FUNCIONAR se você:**
1. ✅ Usar a Opção 2 (conectar ao servidor Expo), OU
2. ✅ Recompilar o APK e instalar o novo

**O APK antigo vai SEMPRE dar erro porque tem o código antigo dentro dele!**

## 🚀 **RECOMENDAÇÃO:**

**USE A OPÇÃO 2 AGORA:**
```bash
npm start
```

Depois escaneie o QR code com o app que já está instalado no celular.

Isso vai fazer o app carregar o código NOVO com todas as correções! 🎉
