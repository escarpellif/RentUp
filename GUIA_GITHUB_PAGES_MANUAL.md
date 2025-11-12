# 📘 GUIA: Configurar GitHub Pages Manualmente

## 🎯 Objetivo
Ativar GitHub Pages para hospedar a página de reset de senha

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Acessar Configurações

**URL:** https://github.com/escarpellif/RentUp/settings/pages

Ou manualmente:
1. Vá em: https://github.com/escarpellif/RentUp
2. Clique na aba **"Settings"** (⚙️)
3. No menu lateral esquerdo, clique em **"Pages"**

---

### 2️⃣ Configurar Source (Origem)

Na página do GitHub Pages, você verá uma seção **"Build and deployment"**

**Configure assim:**

```
Source: Deploy from a branch
```

**Selecione:**
- **Branch:** `main` (no dropdown)
- **Folder:** `/ (root)` (no segundo dropdown)

**Clique em:** `Save`

---

### 3️⃣ Aguardar Deploy

Após clicar em Save:
- Aparecerá uma mensagem de confirmação
- O GitHub começará a processar
- **Aguarde 2-5 minutos**

Você verá algo como:
```
Your site is ready to be published at https://escarpellif.github.io/RentUp/
```

---

### 4️⃣ Verificar Status

**Opção A - Na própria página Settings → Pages:**
- Atualize a página após 2-3 minutos
- Deve aparecer: "Your site is live at..."

**Opção B - Na aba Actions:**
1. Vá em: https://github.com/escarpellif/RentUp/actions
2. Veja o workflow "pages build and deployment"
3. Quando ficar verde ✅ = está pronto!

---

### 5️⃣ Testar a URL

Após o deploy completar, acesse:
```
https://escarpellif.github.io/RentUp/
```

**Deve aparecer:**
- ✅ Página de reset com gradiente verde
- ✅ Logo RentUp
- ✅ Formulário de senha

---

### 6️⃣ Configurar no Supabase

**Acesse:** https://supabase.com/dashboard

1. Projeto: `fvhnkwxvxnsatqmljnxu`
2. **Authentication** → **URL Configuration**
3. Configure:

**Site URL:**
```
https://escarpellif.github.io/RentUp/
```

**Redirect URLs (adicione esta linha):**
```
https://escarpellif.github.io/RentUp/
```

4. Clique em **"Save"**

---

### 7️⃣ Atualizar Código do App

O código já está atualizado com esta URL:
```javascript
redirectTo: 'https://escarpellif.github.io/RentUp/'
```

Apenas **recarregue o app** (pressione R no Metro)

---

## 🖼️ CONFIGURAÇÃO VISUAL

```
┌─────────────────────────────────────────┐
│ GitHub Pages                            │
├─────────────────────────────────────────┤
│                                         │
│ Build and deployment                    │
│                                         │
│ Source                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Deploy from a branch            ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Branch                                  │
│ ┌──────────┐  ┌──────────┐            │
│ │ main  ▼  │  │ /(root) ▼│  [ Save ]  │
│ └──────────┘  └──────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⏱️ Timeline Esperado

```
00:00 - Clica em Save
00:01 - GitHub inicia build
00:30 - Build em progresso
02:00 - Deploy completo
02:30 - Site acessível ✅
```

---

## ✅ Checklist

- [ ] Acessou https://github.com/escarpellif/RentUp/settings/pages
- [ ] Selecionou "Deploy from a branch"
- [ ] Selecionou branch: `main`
- [ ] Selecionou folder: `/ (root)`
- [ ] Clicou em "Save"
- [ ] Aguardou 2-5 minutos
- [ ] Verificou status em Actions
- [ ] Testou URL: https://escarpellif.github.io/RentUp/
- [ ] Configurou Supabase
- [ ] Recarregou app

---

## 🆘 Troubleshooting

### Se ainda der 404 após 5 minutos:

**1. Verificar se index.html está na raiz:**
```bash
cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/RentUp
ls -la index.html
# Deve mostrar o arquivo
```

**2. Verificar último commit:**
```bash
git log --oneline -n 1
# Deve mostrar commit com index.html
```

**3. Forçar novo deploy:**
```bash
git commit --allow-empty -m "Trigger GitHub Pages rebuild"
git push origin main
```

**4. Verificar Actions:**
- Acesse: https://github.com/escarpellif/RentUp/actions
- Veja se há erros no workflow
- Clique no workflow para ver detalhes

---

## 🎯 Configurações Corretas

```yaml
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

**NÃO selecione:**
- ❌ GitHub Actions (deixe "Deploy from a branch")
- ❌ Branch diferente de main
- ❌ Folder /docs

---

## 📊 Status Esperado

### Antes de Configurar:
```
GitHub Pages
  Status: Not configured
  Action: Configure source
```

### Depois de Configurar:
```
GitHub Pages
  Status: ✅ Your site is live at...
  URL: https://escarpellif.github.io/RentUp/
```

---

## 🔍 Como Verificar no Actions

1. Acesse: https://github.com/escarpellif/RentUp/actions
2. Veja workflow: "pages build and deployment"
3. Status:
   - 🟡 Amarelo = Em progresso
   - ✅ Verde = Sucesso
   - ❌ Vermelho = Erro (clique para ver detalhes)

---

## 📱 Após GitHub Pages Funcionar

### 1. Testar Reset de Senha:
1. No app, digite email
2. Clique "¿Olvidaste tu contraseña?"
3. Confirme envio
4. Verifique email
5. Clique no link
6. **Página do GitHub Pages abre** ✅
7. Redefina senha
8. Volte ao app e faça login

---

## 🎉 RESULTADO ESPERADO

```
URL: https://escarpellif.github.io/RentUp/
Status: ✅ Live
Tempo: ~2-5 minutos após configurar
```

**Página mostra:**
- ✅ Gradiente verde RentUp
- ✅ Logo branco com 🏠
- ✅ "Restablecer Contraseña"
- ✅ Formulário funcional
- ✅ Validações em tempo real

---

## 📝 Notas Importantes

1. **Primeira vez demora mais:** 3-5 minutos
2. **Próximos deploys:** 1-2 minutos
3. **Cache do navegador:** Pode precisar Ctrl+F5
4. **Atualizações:** Ao fazer push, auto-deploy
5. **URL permanece:** Não muda, mesmo com updates

---

## 🚀 COMECE AGORA

**A página já está aberta no navegador:**
https://github.com/escarpellif/RentUp/settings/pages

**Siga os passos:**
1. Source: Deploy from a branch ✅
2. Branch: main ✅
3. Folder: / (root) ✅
4. Save ✅
5. Aguarde 2-5 minutos ⏱️
6. Teste a URL ✅

**Boa sorte!** 🎯

