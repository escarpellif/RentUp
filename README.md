# 🎯 ALUKO - Plataforma de Aluguel Colaborativo

**Alquila lo que necesitas. Rentabiliza lo que ya tienes.**

Bem-vindo ao ALUKO! Este é um aplicativo móvel desenvolvido com React Native e Expo que permite aos usuários alugar e emprestar itens de forma colaborativa.

---

## 📚 DOCUMENTAÇÃO DO PROJETO

### 🚀 Para Começar AGORA
- **[START_TODAY.md](./START_TODAY.md)** - Primeiros passos práticos (comece aqui!)
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Guia passo-a-passo de implementação

### 📋 Planejamento
- **[PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md)** - Checklist completo pré-lançamento
- **[LAUNCH_TIMELINE.md](./LAUNCH_TIMELINE.md)** - Timeline de 10 semanas até o lançamento

### 🚀 Publicação
- **[docs/QUICK_START_PUBLISHING.md](./docs/QUICK_START_PUBLISHING.md)** - Guia rápido para começar a publicar
- **[docs/PUBLISHING_CHECKLIST.md](./docs/PUBLISHING_CHECKLIST.md)** - Checklist completo de publicação
- **[docs/STORE_PUBLISHING.md](./docs/STORE_PUBLISHING.md)** - Guia detalhado de publicação nas lojas

### 📖 Documentação Técnica
- **[SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md)** - Análise de segurança
- **[DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md)** - Plano de recuperação
- **[RENTAL_EXPIRATION_README.md](./RENTAL_EXPIRATION_README.md)** - Sistema de expiração

---

## 🎯 STATUS ATUAL DO PROJETO

**Versão:** 1.0.0 (Beta)  
**Data:** 21 de Janeiro de 2026  
**Meta de Lançamento:** Março de 2026

### ✅ Implementado
- Sistema de autenticação (Supabase)
- Cadastro e perfil de usuários
- Sistema de locação completo
- Chat entre usuários
- Reviews e avaliações
- Sistema de disputas
- Painel administrativo
- Localização (ES/EN)
- Verificação de documentos

### 🚧 Em Desenvolvimento
- Sistema de pagamentos (Stripe) - CRÍTICO
- Validações backend - CRÍTICO
- Segurança de uploads - CRÍTICO

### ❌ Pendente
- Crash reporting (Sentry)
- Analytics (Firebase)
- Testes automatizados
- CI/CD
- Termos de Serviço / Privacidade

---

## 🚀 Quick Start

### 1. Install dependencies

```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Start the app

```bash
npx expo start
```

In the output, you'll find options to open the app in a:
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

---

## 🛠️ Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Pagamentos:** Stripe (em implementação)
- **Maps:** React Native Maps
- **Localização:** i18next (ES/EN)
- **Crash Reporting:** Sentry (em implementação)
- **Analytics:** Firebase (em implementação)

---

## 📁 Estrutura do Projeto

```
aluko/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas do app
│   ├── services/        # Serviços (auth, api, etc)
│   ├── styles/          # Estilos globais
│   ├── utils/           # Utilitários
│   ├── hooks/           # Custom hooks
│   ├── i18n/            # Traduções
│   └── constants/       # Constantes
├── assets/              # Imagens, fontes, etc
├── supabase/            # Edge Functions
└── App.js               # Entry point
```

---

## 🔐 Segurança

Este projeto implementa múltiplas camadas de segurança:

- ✅ Row Level Security (RLS) no Supabase
- ✅ Autenticação com JWT
- ✅ Validação de senha forte
- ✅ Verificação de documentos
- 🚧 Validações backend (em implementação)
- 🚧 Rate limiting (em implementação)

Ver [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md) para detalhes.

---

## 🚀 Roadmap para Lançamento

### Semana 1-2: Segurança
- [ ] Migrar chaves para .env
- [ ] Implementar Sentry
- [ ] Validações backend
- [ ] Testar RLS policies

### Semana 3-4: Pagamentos
- [ ] Integrar Stripe
- [ ] Implementar fluxo de pagamento
- [ ] Sistema de depósito

### Semana 5: Monitoramento
- [ ] Firebase Analytics
- [ ] Logging estruturado
- [ ] Dashboards

### Semana 6-10: Testes & Lançamento
- [ ] Testes completos
- [ ] Beta testing
- [ ] Correções finais
- [ ] 🚀 LANÇAMENTO

Ver [LAUNCH_TIMELINE.md](./LAUNCH_TIMELINE.md) para detalhes completos.

---

## 📱 Funcionalidades Principais

### Para Usuários
- ✅ Cadastro e autenticação
- ✅ Perfil com verificação de identidade
- ✅ Buscar itens por localização
- ✅ Solicitar aluguel de itens
- ✅ Chat com outros usuários
- ✅ Sistema de reviews
- ✅ Histórico de locações

### Para Proprietários
- ✅ Anunciar itens para aluguel
- ✅ Gerenciar disponibilidade
- ✅ Aprovar/rejeitar solicitações
- ✅ Sistema de códigos de confirmação
- ✅ Reportar problemas/disputas

### Para Administradores
- ✅ Painel administrativo
- ✅ Aprovar verificações
- ✅ Gerenciar usuários
- ✅ Resolver disputas
- ✅ Analytics e relatórios

---

## 🧪 Testing

```bash
# Testes unitários (TODO)
npm test

# Testes E2E (TODO)
npm run test:e2e

# Linting
npm run lint
```

---

## 📦 Build & Deploy

```bash
# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios

# Submit para lojas
eas submit --platform android
eas submit --platform ios
```

---

## 🤝 Contribuindo

Este é um projeto privado em desenvolvimento. Para contribuir:

1. Crie uma branch feature
2. Faça suas alterações
3. Teste extensivamente
4. Crie um Pull Request

---

## 📄 Licença

Propriedade privada. Todos os direitos reservados.

---

## 📞 Contato & Suporte

- **Email:** support@aluko.io
- **Website:** https://aluko.io (em construção)
- **GitHub:** https://github.com/escarpellif/aluko

---

## 🙏 Agradecimentos

- Expo team
- Supabase team
- React Native community
- Todos os beta testers

---

**Desenvolvido com ❤️ por Fernando Escarpelli**

**Última atualização:** 21 de Janeiro de 2026

