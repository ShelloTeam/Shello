# 📋 BACKLOG DE TAREFAS — FRONT-END SHELLO

Este arquivo documenta as tarefas de implementação do front-end móvel do **Shello**.
> **Regra para o Agente de IA:** Conclua uma sub-tarefa por vez, garanta que os testes passem, execute `npm run ts-check` e faça um commit pequeno correspondente antes de marcar `[x]`.

---

## 🏗️ Fase 0: Setup da Suite de Testes (TDD) & AsyncStorage Mock

- [ ] **Task 0.1: Instalação das Dependências de Teste e AsyncStorage**
  - Instalar Jest, `@testing-library/react-native`, `@testing-library/jest-native`, `jest-expo` (se utilizando Expo), e os tipos `@types/jest`.
  - Instalar `@react-native-async-storage/async-storage` no projeto `/frontend`.
- [ ] **Task 0.2: Configuração do `jest.config.js` e Mocks**
  - Criar/configurar o arquivo de configuração do Jest integrado ao Expo.
  - Configurar um arquivo de setup do Jest para mockar o AsyncStorage (usando o mock padrão fornecido pelo pacote `@react-native-async-storage/async-storage/jest/async-storage-mock`).
  - Adicionar o script `"test": "jest"` e `"test:watch": "jest --watch"` no `package.json`.
- [ ] **Task 0.3: Teste de Sanidade**
  - Criar um teste simples (`src/__tests__/sanity.test.ts`) garantindo que o Jest executa testes unitários com sucesso.

---

## 🎨 Fase 1: Setup do Design System, Context API & Serviços de Mock

- [ ] **Task 1.1: Criação do Arquivo de Tema**
  - Criar `src/styles/theme.ts` contendo o objeto `ShelloTheme` exportado conforme especificado em `ui_ux.md` (paleta de cores Sage Theme).
  - Escrever teste unitário validando os tokens de cores.
- [ ] **Task 1.2: Criação da Camada de Serviços Mockados**
  - Criar `src/services/mockServices.ts` contendo funções assíncronas para ler/salvar diário, tarefas, dados de onboarding e memórias da IA.
  - Utilizar `AsyncStorage` para guardar os dados no dispositivo e usar `setTimeout` para simular latência de rede.
  - Escrever testes unitários para validar que os métodos do mock salvam e carregam os dados adequadamente do mock local.
- [ ] **Task 1.3: Criação do Contexto Global (`ShelloContext.tsx`)**
  - Criar `src/contexts/ShelloContext.tsx` utilizando React Context API para expor o estado de login, onboarding_done, notas do diário, lista de tarefas (To-Do) e memórias do perfil.
  - Prover funções para adicionar notas, alternar tarefas, salvar onboarding e remover memórias.
  - Escrever testes para garantir que o contexto gerencia o estado e propaga as atualizações.

---

## 🔒 Fase 2: Fluxo Pré-Hub (Autenticação e Onboarding)

- [ ] **Task 2.1: Tela de Autenticação (`AuthScreen.tsx`)**
  - *TDD:* Escrever testes para verificar a exibição dos campos de input, clique dos botões e alternância dos formulários ('login' | 'register' | 'recover') baseados nos estilos `StyleSheet`.
  - *Código:* Criar `src/screens/AuthScreen.tsx` e implementar a lógica de alternação de estado de form, simulação de loading de 800ms antes de atualizar o status de autenticação no context e redirecionar.
- [ ] **Task 2.2: Tela de Onboarding Sequencial (`OnboardingScreen.tsx`)**
  - *TDD:* Escrever testes para as transições entre os 3 passos horizontais do onboarding e verificar se os inputs salvam os valores corretos chamando o `ShelloContext`.
  - *Código:* Criar `src/screens/OnboardingScreen.tsx` com o formulário de 3 etapas ("Como prefere ser chamado?", "Descrição estilo de vida", "Meta de melhora atual"). Ao finalizar, chamar a função de salvar no contexto (que persiste no AsyncStorage) e setar `onboarding_done = true`.

---

## 🌿 Fase 3: Navegação Principal (`BottomTabNavigator`)

- [ ] **Task 3.1: Configuração do BottomTabNavigator**
  - *TDD:* Escrever testes garantindo que as abas inferiores existem e apontam para as respectivas telas de visualização.
  - *Código:* Implementar a navegação de abas em `src/navigation/BottomTabNavigator.tsx` contendo as 5 abas principais (Home, Diário, Chat Shello, Tarefas, Perfil). Customizar ícones Feather e otimizar para transições rápidas (<300ms).

---

## 🏠 Fase 4: Telas do Hub Principal

- [ ] **Task 4.1: Tela Home (`HomeScreen.tsx`)**
  - *TDD:* Testar se a saudação exibe o nome correto coletado do `ShelloContext`. Testar se os cards de streak ("7 day streak") e entries ("24 entries") são exibidos. Testar se os botões de atalho realizam a navegação.
  - *Código:* Criar `src/screens/HomeScreen.tsx` com os componentes visuais detalhados em `ui_ux.md`.
- [ ] **Task 4.2: Tela do Diário (`DiaryScreen.tsx`)**
  - *TDD:* Escrever testes simulando a digitação no diário, a exibição da lista histórica e a abertura do BottomSheet customizado (usando `Modal` nativo) após 1.5s ao salvar. Testar os botões de confirmar (chama salvar contexto) e cancelar do modal.
  - *Código:* Criar `src/screens/DiaryScreen.tsx` com a área de texto, FlatList com notas mockadas e o modal customizado de insights da IA.
- [ ] **Task 4.3: Tela do Agente Shello (`ChatScreen.tsx`)**
  - *TDD:* Escrever testes para envio de mensagens, checagem da exibição do balão direito/esquerdo, renderização do Skeleton loader customizado durante os 3 segundos de "pensamento" e renderização do card flutuante de criação de tarefas.
  - *Código:* Criar `src/screens/ChatScreen.tsx` e implementar o histórico de mensagens, Shimmer loader simulado via `Animated` nativo e pop-up interativo para criar tarefas.
- [ ] **Task 4.4: Tela de Tarefas (`ToDoScreen.tsx`)**
  - *TDD:* Escrever testes para alternar abas "Active"/"Completed", validar o destaque visual de itens atrasados (`error`) e testar a remoção/conclusão do item ao clicar no checkbox (simulando com animação).
  - *Código:* Criar `src/screens/ToDoScreen.tsx` conectado ao contexto global. Utilizar `Animated` para transição visual suave de remoção de item.
- [ ] **Task 4.5: Tela de Perfil e Painel de Contexto (`ProfileScreen.tsx`)**
  - *TDD:* Escrever testes para os inputs de configurações da personalidade do agente e testar a remoção das memórias com animação de fade-out.
  - *Código:* Criar `src/screens/ProfileScreen.tsx` conectado ao contexto global. Utilizar `Animated` para aplicar fade-out de exclusão dos cards de memórias.
