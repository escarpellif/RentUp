# ⚡ GUIA RÁPIDO - Testar App no Android

## 🎯 Forma Mais Fácil (Recomendada)

### 1. Abra um NOVO terminal
```bash
cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko
```

### 2. Execute o script
```bash
./start-android.sh
```

Ou com cache limpo:
```bash
./start-android.sh --clear
```

---

## 🔧 Comandos Alternativos

Se preferir usar npm diretamente:

```bash
# Carregar NVM (necessário em terminais novos)
source ~/.bashrc

# Iniciar para Android
npm run android

# Ou com cache limpo
npm run android:clear
```

---

## 📱 Antes de Executar

**Certifique-se que o emulador Android está rodando:**

1. Abra o Android Studio
2. Clique em "More Actions" → "Virtual Device Manager"
3. Clique no ▶️ ao lado do emulador
4. Aguarde ele carregar completamente

**OU via terminal:**
```bash
emulator -list-avds
emulator -avd <NOME_DO_AVD> &
```

**Verificar se está conectado:**
```bash
adb devices
```

---

## ❓ Problemas Comuns

### "npx não encontrado"
```bash
source ~/.bashrc
```
Depois tente novamente.

### Emulador não detectado
```bash
adb devices
```
Se não aparecer nada, reinicie o emulador.

### App não carrega
```bash
./start-android.sh --clear
```

---

## 📚 Mais Detalhes

- **Setup completo**: Veja `SETUP_COMPLETO.md`
- **Android Studio detalhado**: Veja `ANDROID_STUDIO_TESTING.md`
