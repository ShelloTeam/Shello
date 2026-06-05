# 📋 BACKLOG DE TAREFAS — FRONT-END SHELLO

> **Regra para o Agente de IA:** Conclua uma sub-tarefa por vez, garanta que os testes passem, execute `make check` e faça um commit pequeno correspondente antes de marcar `[x]`.

---

## ✅ Fases Concluídas

### Fase 0 — Setup TDD & AsyncStorage
- [x] Instalação de dependências de teste (jest, @testing-library, jest-expo)
- [x] Configuração jest.config.js + mocks AsyncStorage
- [x] Teste de sanidade (3 testes ✅)

### Fase 1 — Design System, Context API & Serviços Mock
- [x] `src/styles/tema.ts` — ShelloTema (Sage Theme)
- [x] `src/types/index.ts` — todos os tipos do domínio
- [x] `src/services/mockServicos.ts` — camada de serviços mockados
- [x] `src/contexts/ShelloContext.tsx` — estado global com Context API

### Fase 2 — Fluxo de Autenticação & Onboarding
- [x] `TelaAutenticacao.tsx` — Login / Cadastro / Recuperação de senha
- [x] `TelaOnboarding.tsx` — 3 etapas com animação de slide

### Fase 3 — Navegação Principal
- [x] `NavegacaoAbas.tsx` — BottomTabNavigator com 5 abas
- [x] `NavegacaoDiario.tsx` — Stack Navigator aninhado (Lista → EntradaDiario)
- [x] `navigation/index.tsx` — roteamento inteligente (carregando → pré-hub → hub)

### Fase 4 — Remodelagem das Telas do Hub (Sessão 2)
- [x] `HomeScreen.tsx` — saudação serifada, badges, 2 atalhos limpos, FAB com logo real
- [x] `TelaDiario.tsx` — lista de entradas agrupadas por data, badge de contexto
- [x] `TelaEntradaDiario.tsx` — **NOVO** bloco de notas com [Finalizar] + [+ Contexto Shello]
- [x] `TelaChat.tsx` — limite 20 msgs, card de tarefa, sprite de expressões
- [x] `TelaTarefas.tsx` — "Sua Jornada", modal de criação funcional, rotinas
- [x] `TelaPerfil.tsx` — badges coloridas por tipo de memória, avatar real, nome editável

### Cobertura de Testes Atual
| Suite | Testes | Status |
|-------|--------|--------|
| sanidade | 3 | ✅ |
| tema | 9 | ✅ |
| mockServicos | 15 | ✅ |
| TelaEntradaDiario | 10 | ✅ |
| TelaChat | 8 | ✅ |
| **Total** | **45** | **✅ 0 erros TS** |

---

## 🔴 BUGS CONHECIDOS (Alta Prioridade)

### BUG-01 — Ícone de Chat na HomeScreen
- **Problema:** A HomeScreen ainda exibe o FAB (botão flutuante) que navega para o ChatTab. O usuário pediu explicitamente múltiplas vezes para **remover qualquer referência ao Chat da Home** pois o botão já existe no menu inferior.
- **Arquivo:** `frontend/src/screens/HomeScreen.tsx` — linhas ~90 e ~190 (função `irParaChat` e o FAB)
- **Correção:** Remover completamente `irParaChat`, o FAB e a `View` de posicionamento absoluto. O FAB pode ser substituído por um terceiro card de atalho (ex: "Refletir agora") ou simplesmente removido.

### BUG-02 — Fluxo de Deslogar Quebrado
- **Problema:** `handleSair` em `TelaPerfil.tsx` chama `concluirOnboarding({})` com dados vazios, o que seta `onboardingConcluido = true` mas o app não redireciona para a tela de login. O usuário "sai" mas continua logado.
- **Arquivo:** `frontend/src/screens/TelaPerfil.tsx` + `frontend/src/contexts/ShelloContext.tsx`
- **Correção:**
  1. Adicionar ação `resetarConta()` no ShelloContext que limpa todo o estado e seta `onboardingConcluido = false`
  2. Chamar `resetarConta()` no `handleSair` em vez de `concluirOnboarding`
  3. A navegação em `navigation/index.tsx` já detecta `onboardingConcluido === false` e redireciona para o pré-hub

### BUG-03 — Criação de Tarefas com Data Bugada
- **Problema:** O campo de data na TelaTarefas aceita entrada em `dd/mm/aaaa` mas a conversão para ISO 8601 pode falhar em edge cases. Datas inválidas (ex: 31/02) não são rejeitadas corretamente. O campo também é confuso para o usuário (texto livre em vez de picker).
- **Arquivo:** `frontend/src/screens/TelaTarefas.tsx` — modal de nova tarefa
- **Correção:** Substituir o campo de texto de data por um DatePicker nativo via `@react-native-community/datetimepicker` ou simplificar para apenas mostrar um seletor de "hoje / amanhã / esta semana".

---

## 🟡 MELHORIAS PENDENTES (Média Prioridade)

### MELHORIA-01 — Refinamento Visual da HomeScreen
- A tela está funcional mas pode ter mais personalidade visual
- Adicionar fundo com gradiente suave sálvia→creme no topo
- Melhorar proporções dos cards de atalho (altura, ícone maior)
- Badge "🔥 7 dias seguidos" é **dado falso** — calcular streak real a partir de `entradas.dataCriacao` ou esconder até haver lógica real
- Considerar seção "Última reflexão" mostrando preview da última entrada do diário

### MELHORIA-02 — Mascote Shello & Animações
- O sprite sheet `shello-expressoes.jpeg` com 4 expressões está em uso no Chat, mas as animações de transição entre expressões poderiam ser mais suaves (cross-fade entre quadros)
- Criar um componente `<MascoteShello />` reutilizável que qualquer tela pode usar
- Adicionar animação de "respiração" (scale pulsando suavemente) ao mascote quando está em idle
- A imagem `WhatsApp Image 2026-04-06 at 19.20.11.jpeg` na raiz do projeto deve ser movida para `frontend/assets/` com nome adequado

### MELHORIA-03 — Code Review Pendentes (baixo impacto)
- HomeScreen: `dataFormatada`/`saudacao` sem `useMemo`
- TelaDiario: `renderItem` cria closure a cada render (falta `React.memo` no `CardEntrada`)
- TelaChat: `setTimeout` de 2800ms sem cleanup no unmount
- TelaChat: cores `#4CAF50` e `#8B5E3C` hardcoded fora do ShelloTema
- TelaPerfil: `nomeReferencia` pode ficar vazio se `dadosOnboarding` é `null` no mount

---

## 🔵 PRÓXIMAS FASES (Integração com Backend)

> Executar **após** resolver os bugs acima. O backend usa FastAPI + PostgreSQL.
> Documentação completa em `project_context.md`.

### Fase 5 — Integração de Autenticação Real
- [ ] Substituir mock de login por `POST /api/auth/login` (JWT)
- [ ] Substituir mock de cadastro por `POST /api/auth/register`
- [ ] Armazenar JWT no AsyncStorage
- [ ] Interceptor de requisições com token no header `Authorization: Bearer <token>`
- [ ] Refresh token automático quando expirar

### Fase 6 — Integração do Diário
- [ ] `GET /api/diary/entries` — carregar entradas do servidor
- [ ] `POST /api/diary/entries` — salvar nova entrada
- [ ] `PATCH /api/diary/entries/:id` — editar entrada existente
- [ ] Manter cache local com AsyncStorage (offline-first)

### Fase 7 — Integração do Chat com IA Real
- [ ] `POST /api/chat/message` — enviar mensagem e receber resposta da IA
- [ ] Streaming de resposta (WebSocket ou SSE) para UX mais fluida
- [ ] Persistir histórico de conversa no backend
- [ ] Expressões do mascote baseadas no `sentiment` retornado pela API

### Fase 8 — Integração de Tarefas & Memórias
- [ ] `GET/POST/PATCH /api/tasks` — CRUD de tarefas
- [ ] `GET/POST/DELETE /api/memories` — CRUD de memórias da IA
- [ ] `PUT /api/users/preferences` — formalidade e nome de referência

### Fase 9 — Push Notifications & Polimento Final
- [ ] Configurar Expo Notifications para lembretes de diário
- [ ] Onboarding: adicionar tela de permissão de notificação
- [ ] Testes de integração com backend real
- [ ] Testes E2E com Detox ou Maestro

---

## 📌 Ordem Sugerida para Próxima Sessão

1. **BUG-01** — Remover FAB/chat da HomeScreen ← usuário pediu múltiplas vezes
2. **BUG-02** — Corrigir deslogar (`resetarConta` no contexto)
3. **BUG-03** — Melhorar seletor de data nas Tarefas
4. **MELHORIA-01** — Refinar visual da HomeScreen
5. **MELHORIA-02** — Componente `<MascoteShello />` reutilizável
6. Commit + `git push origin frontend`
7. Iniciar Fase 5 (autenticação real)
