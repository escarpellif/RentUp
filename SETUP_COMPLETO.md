# 🎉 CONFIGURAÇÃO COMPLETA - Node.js Instalado!

## ✅ O que foi instalado:

- **NVM (Node Version Manager)**: v0.39.7
- **Node.js**: v24.13.0 (LTS)
- **npm**: v11.6.2
- **npx**: Incluído com npm

---

## 🚀 COMO TESTAR SEU APP NO ANDROID AGORA

### Opção 1: Usando o Script Automático (MAIS FÁCIL)

```bash
./start-android.sh
```

Para limpar cache antes de iniciar:
```bash
./start-android.sh --clear
```

---

### Opção 2: Comandos Manuais

**IMPORTANTE**: Para usar `npx` e `npm`, você precisa carregar o NVM primeiro em cada novo terminal.

#### Passo 1: Carregar o NVM (faça isso em cada novo terminal)
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

#### Passo 2: Iniciar o Expo para Android
```bash
npx expo start --android
```

---

## 🔧 Automatizar o NVM (Recomendado)

Para não precisar carregar o NVM manualmente toda vez, ele já foi adicionado ao seu `~/.bashrc`.

**Para aplicar agora, execute:**
```bash
source ~/.bashrc
```

**Ou simplesmente abra um NOVO terminal** e o NVM estará disponível automaticamente.

---

## 📱 Preparar o Android Studio

### 1. Verificar se o Android SDK está configurado:
```bash
echo $ANDROID_HOME
```

Se não retornar nada, adicione ao `~/.bashrc`:
```bash
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### 2. Iniciar o emulador Android:

**Pelo Android Studio:**
1. Abra o Android Studio
2. Clique em "More Actions" → "Virtual Device Manager"
3. Clique no ▶️ ao lado do seu emulador

**Ou pela linha de comando:**
```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar um emulador (substitua pelo nome do seu)
emulator -avd Pixel_5_API_33 &
```

### 3. Verificar se o dispositivo está conectado:
```bash
adb devices
```

Deve mostrar algo como:
```
List of devices attached
emulator-5554   device
```

---

## 🎯 TESTAR O APP - PASSO A PASSO COMPLETO

### Método 1: Expo (Mais Rápido)

```bash
# 1. Carregue o NVM (se ainda não fez)
source ~/.bashrc

# 2. Inicie o emulador Android (Android Studio ou linha de comando)
# Aguarde até que esteja totalmente iniciado

# 3. No diretório do projeto, execute:
./start-android.sh

# OU manualmente:
npx expo start --android
```

**O que vai acontecer:**
- O Metro Bundler iniciará
- O Expo detectará o emulador
- Instalará o Expo Dev Client automaticamente
- Abrirá seu app no emulador

---

### Método 2: Gerar arquivos nativos e usar Android Studio

```bash
# 1. Carregar NVM
source ~/.bashrc

# 2. Gerar pasta android/
npx expo prebuild --platform android

# 3. Abrir no Android Studio
# File → Open → Selecione a pasta android/

# 4. Aguardar Gradle Sync completar

# 5. Clicar no botão Run ▶️
```

---

## 🐛 Resolução de Problemas

### "Command 'npx' not found"
```bash
# Carregue o NVM
source ~/.bashrc

# OU use o script
./start-android.sh
```

### "No Android device connected"
```bash
# Verificar se o emulador está rodando
adb devices

# Se não aparecer nada, inicie o emulador
emulator -list-avds
emulator -avd <NOME_DO_SEU_AVD> &
```

### Emulador não inicia
1. Abra o Android Studio
2. Tools → Device Manager
3. Crie um novo AVD se necessário (recomendado: Pixel 5, API 33)
4. Clique no ▶️ para iniciar

### App não carrega / Tela verde
```bash
# Limpar todos os caches
npx expo start -c

# OU use o script com --clear
./start-android.sh --clear
```

### Erro "window is not defined" (JÁ RESOLVIDO)
✅ Já corrigimos os arquivos `.web.js`

---

## 📝 Comandos Úteis

### Verificar versões instaladas:
```bash
source ~/.bashrc
node --version
npm --version
npx --version
```

### Limpar cache do Expo:
```bash
npx expo start -c
```

### Desinstalar app do emulador:
```bash
adb uninstall com.aluko.app
```

### Reinstalar dependências:
```bash
rm -rf node_modules
npm install
```

### Ver logs do Android:
```bash
adb logcat | grep -i "aluko"
```

---

## 🎊 PRONTO PARA COMEÇAR!

Agora você tem tudo configurado. Para testar seu app:

1. **Abra um NOVO terminal** (para carregar o NVM automaticamente)
2. **Navegue até o projeto:**
   ```bash
   cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko
   ```
3. **Inicie o emulador Android** (pelo Android Studio ou linha de comando)
4. **Execute o script:**
   ```bash
   ./start-android.sh
   ```

**OU simplesmente:**
```bash
source ~/.bashrc
npx expo start --android
```

---

## 💡 Dicas Finais

1. **Sempre use um NOVO terminal** ou execute `source ~/.bashrc` para carregar o NVM
2. **Use o script `./start-android.sh`** para facilitar - ele cuida de tudo
3. **Mantenha o emulador rodando** enquanto desenvolve
4. **Use `npx expo start -c`** se encontrar erros estranhos de cache
5. **Para iOS**, você precisará de um Mac com Xcode instalado

---

## 🔗 Links Úteis

- [Documentação do Expo](https://docs.expo.dev/)
- [NVM GitHub](https://github.com/nvm-sh/nvm)
- [Android Studio Download](https://developer.android.com/studio)
- [React Native Docs](https://reactnative.dev/)
