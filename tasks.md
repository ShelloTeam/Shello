# 📋 BACKLOG DE TAREFAS — FRONT-END SHELLO

Este arquivo documenta as tarefas de implementação do front-end móvel do **Shello**.
> **Regra para o Agente de IA:** Conclua uma sub-tarefa por vez, garanta que os testes passem, execute `npm run ts-check` e faça um commit pequeno correspondente antes de marcar `[x]`.

---

## 🏗️ Fase 0: Setup da Suite de Testes (TDD) & AsyncStorage Mock

- [x] **Task 0.1: Instalação das Dependências de Teste e AsyncStorage**
  - Instalado: `jest`, `@testing-library/react-native`, `@testing-library/jest-native`, `jest-expo`, `@types/jest`
  - Instalado: `@react-native-async-storage/async-storage` (v3.x) no projeto `/frontend`
  - Instalado: `@react-navigation/native-stack`
- [x] **Task 0.2: Configuração do `jest.config.js` e Mocks**
  - Criado `frontend/jest.config.js` com preset `jest-expo`
  - Criado `frontend/jest.setup.ts` com mock manual do AsyncStorage (compatível com v3.x)
  - Adicionados scripts `"test"`, `"test:watch"` e `"test:coverage"` no `package.json`
- [x] **Task 0.3: Teste de Sanidade**
  - Criado `src/__tests__/sanidade.test.ts` — 3 testes passando ✅

---

## 🎨 Fase 1: Setup do Design System, Context API & Serviços de Mock

- [x] **Task 1.1: Criação do Arquivo de Tema**
  - Criado `src/styles/tema.ts` com `ShelloTema` (Sage Theme: cores, tipografia, bordas, espaçamento, sombras)
  - Criados tipos em `src/types/index.ts` (`NotaDiario`, `Tarefa`, `Rotina`, `MemoriaIA`, `DadosOnboarding`, `MensagemChat`, `NivelFormalidade`)
  - Criado `src/__tests__/tema.test.ts` — 6 testes passando ✅
- [x] **Task 1.2: Criação da Camada de Serviços Mockados**
  - Criado `src/services/mockServicos.ts` com funções assíncronas usando `AsyncStorage` + `setTimeout`
  - Funções: `salvarNota`, `buscarNotas`, `salvarTarefa`, `buscarTarefas`, `alternarTarefa`, `salvarDadosOnboarding`, `buscarDadosOnboarding`, `salvarMemoria`, `buscarMemorias`, `removerMemoria`
  - Criado `src/__tests__/mockServicos.test.ts` — 13 testes passando ✅
- [x] **Task 1.3: Criação do Contexto Global (`ShelloContext.tsx`)**
  - Criado `src/contexts/ShelloContext.tsx` com React Context API
  - Estado: `nomeUsuario`, `onboardingConcluido`, `carregando`, `nivelFormalidade`, `notas`, `tarefas`, `memorias`
  - Ações: `adicionarNota`, `adicionarTarefa`, `alternarTarefa`, `concluirOnboarding`, `adicionarMemoria`, `removerMemoria`, `setNivelFormalidade`

---

## 🔒 Fase 2: Fluxo Pré-Hub (Autenticação e Onboarding)

- [x] **Task 2.1: Tela de Autenticação (`TelaAutenticacao.tsx`)**
  - Criado `src/screens/TelaAutenticacao.tsx` (578 linhas)
  - 3 formulários com alternância animada: `'login' | 'cadastro' | 'recuperar'`
  - Toggle de senha (eye/eye-off), botão com `ActivityIndicator` 800ms
  - `KeyboardAvoidingView` + `ScrollView`
- [x] **Task 2.2: Tela de Onboarding Sequencial (`TelaOnboarding.tsx`)**
  - Criado `src/screens/TelaOnboarding.tsx` (580 linhas)
  - 3 etapas com animação de slide horizontal + fade paralelos
  - Indicador de progresso em bolinhas pill
  - Salva via `concluirOnboarding()` do `ShelloContext`

---

## 🌿 Fase 3: Navegação Principal (`BottomTabNavigator`)

- [x] **Task 3.1: Configuração do BottomTabNavigator**
  - Criado `src/navigation/NavegacaoAbas.tsx` com 5 abas (Home, Diário, Chat, Tarefas, Perfil)
  - Botão central do Chat estilizado: círculo 64px verde sálvia elevado
  - Roteamento inteligente em `src/navigation/index.tsx`: carregando → pré-hub → hub
  - `App.tsx` atualizado com `ShelloProvider` + `SafeAreaProvider`

---

## 🏠 Fase 4: Telas do Hub Principal

- [x] **Task 4.1: Tela Home (`HomeScreen.tsx`)**
  - Reescrita completamente (478 linhas)
  - Data em PT-BR, saudação personalizada, badges pill, card de diário rápido
  - FAB com animação Spring + bolinha de notificação, atalhos de navegação
- [x] **Task 4.2: Tela do Diário (`TelaDiario.tsx`)**
  - Criado (581 linhas)
  - Editor de texto livre, FlatList agrupada por data, Modal de insights da IA com slide-up animado
- [x] **Task 4.3: Tela do Agente Shello (`TelaChat.tsx`)**
  - Criado (727 linhas)
  - Balões de chat esquerda/direita, ShimmerLoader via `Animated.loop`, sugestões iniciais, card de criação de tarefa
- [x] **Task 4.4: Tela de Tarefas e Rotinas (`TelaTarefas.tsx`)**
  - Criado (651 linhas)
  - Checkboxes circulares com animação de conclusão, tarefas atrasadas com borda vermelha, Modal de nova tarefa, rotinas diárias em cards
- [x] **Task 4.5: Tela de Perfil e Painel de Contexto (`TelaPerfil.tsx`)**
  - Criado (562 linhas)
  - Seletor de formalidade, painel de memórias com cards por tipo, animação fade-out de exclusão

---

## ✅ Resumo do Progresso

| Fase | Status | Testes |
|------|--------|--------|
| Fase 0 — Setup TDD | ✅ Concluída | 3 testes ✅ |
| Fase 1 — Design System & Context | ✅ Concluída | 19 testes ✅ |
| Fase 2 — Auth & Onboarding | ✅ Concluída | — |
| Fase 3 — Navegação | ✅ Concluída | — |
| Fase 4 — Telas do Hub | ✅ Concluída | — |

**Total: 22 testes passando, 0 erros TypeScript**

---

## 🔜 Próximas Fases (Backend Integration)

- [ ] Substituir `mockServicos.ts` por chamadas reais à API REST
- [ ] Implementar autenticação real com JWT
- [ ] Conectar o Chat com a IA real
- [ ] Adicionar push notifications
