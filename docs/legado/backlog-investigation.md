# Backlog — Investigação Detalhada

> Gerado em: 2026-06-14  
> Método: análise estática do código-fonte (frontend)

---

## Context Fragments

### CF-01 · Duplicação ao adicionar contexto

**Status:** ✅ Resolvido (compara 250 chars no client e carrega adicionadaAoContexto via memorias)  
**Evidências:**  
- `ShelloContext.tsx` L109–112: `conteudoSimilar` compara apenas 60 primeiros chars normalizados.  
- Uma entrada com "Hoje foi um dia difícil porque..." e outra com "Hoje foi um dia difícil mas..." passariam ambas pelo filtro.  
- O mapper `mapDiaryEntry` (L63) zera `adicionadaAoContexto` a cada reload, tornando a proteção visual ineficaz entre sessões.  

**Fluxo atual:**  
`TelaEntradaDiario` → `adicionarAoContexto()` → `marcarEntradaComoContexto()` no contexto → POST /api/memories → GET /api/memories (double fetch)

**Arquivos envolvidos:** `ShelloContext.tsx`, `TelaEntradaDiario.tsx`  
**Complexidade estimada:** Baixa (fix da comparação + persistência do campo)  
**Dependências:** Contrato com backend para retornar `adicionadaAoContexto`  
**Necessita spec futura:** Não — fix técnico direto

---

### CF-02 · Escalabilidade da visualização de memórias

**Status:** ⚠️ Hipótese  
**Evidências:**  
- `TelaPerfil.tsx` renderiza `listaMemorias.map(...)` dentro de `ScrollView` — sem `FlatList` ou virtualização.  
- Com poucas memórias (estado atual), não há problema de performance.  
- Com crescimento orgânico (usuário ativo por semanas), a lista pode acumular dezenas de entradas.  

**Fluxo atual:**  
ScrollView → map de CardMemoria (componentes com Animated.Value individuais)

**Complexidade estimada:** Baixa-Média (migrar para FlatList + paginação)  
**Dependências:** Paginação na API `/api/memories`  
**Necessita spec futura:** Sim — definir threshold que justifica paginação e UI do modal

---

### CF-03 · Necessidade de modal para grandes volumes

**Status:** ⚠️ Hipótese (depende de CF-02)  
**Evidências:** Sem dados de uso real ainda. A hipótese depende do volume real de memórias por usuário.  
**Complexidade estimada:** Média  
**Necessita spec futura:** Sim

---

## Diário

### D-01 · Exclusão de entradas

**Status:** ✅ Resolvido (função removerEntrada no context + DELETE + botão na top bar e DialogShello)  
**Evidências:**  
- `ShelloContextData` (L20–51): sem `removerEntrada`.  
- `TelaEntradaDiario.tsx`: barra superior tem voltar + título + `espacadorDireita` (espaçador vazio). Sem botão de delete.  
- Backend: nenhuma chamada `DELETE /api/diary/:id` no frontend.  

**Fluxo atual:** Inexistente. Usuário não consegue excluir entrada.  
**Complexidade estimada:** Baixa (context + endpoint + botão na UI)  
**Dependências:** Endpoint `DELETE /api/diary/:id` no backend  
**Necessita spec futura:** Não — comportamento óbvio (confirmar antes de excluir)

---

### D-02 · Melhor navegação

**Status:** ✅ Confirmado — navegação básica apenas  
**Evidências:**  
- `TelaDiario.tsx`: FlatList com agrupamento por período (Hoje / Ontem / Semana / Antigas). Sem scroll para data específica, sem filtro, sem contador por grupo.  
- Nenhum controle de navegação temporal além da scroll contínua.  

**Complexidade estimada:** Média  
**Necessita spec futura:** Sim — definir modelo de navegação (timeline, meses, etc)

---

### D-03 · Busca

**Status:** ✅ Confirmado — ausente  
**Evidências:** Nenhum campo de busca em `TelaDiario.tsx`. Nenhum endpoint de search na camada de serviços.  
**Complexidade estimada:** Média  
**Dependências:** Endpoint de busca no backend OU busca client-side nas entradas carregadas  
**Necessita spec futura:** Não para MVP (busca local em entradas carregadas)

---

### D-04 · Filtros

**Status:** ✅ Confirmado — ausente  
**Evidências:** Sem UI de filtros em `TelaDiario.tsx`.  
**Complexidade estimada:** Baixa-Média  
**Necessita spec futura:** Sim — definir filtros disponíveis (por período, por contexto adicionado, etc)

---

### D-05 · Revisão de fluxos redundantes / possível duplicidade de botões

**Status:** 🔍 Necessita investigação aprofundada  
**Evidências preliminares:**  
- `TelaEntradaDiario.tsx`: barra de ações tem **dois** botões visíveis ao mesmo tempo ("+ Contexto Shello" e "Finalizar entrada"). Em entradas novas não salvas, ambos criam a entrada antes de executar sua ação principal — fluxo com side effect implícito.  
- `TelaDiario.tsx`: botão "Nova Entrada" está tanto na barra superior quanto no estado vazio (CTA).  

**Complexidade estimada:** Baixa  
**Necessita spec futura:** Não — revisão pontual

---

## Tasks

### T-01 · Exclusão de tarefas

**Status:** ✅ Resolvido (removerTarefa no context + DELETE + long press e DialogShello)  
**Evidências:**  
- `ShelloContextData`: apenas `adicionarTarefa` e `alternarTarefa`.  
- `TelaTarefas.tsx`: `ItemTarefa` expõe apenas checkbox — sem swipe-to-delete, long-press ou botão de exclusão.  
- Backend: nenhuma chamada `DELETE /api/tasks/:id`.  

**Complexidade estimada:** Baixa  
**Dependências:** Endpoint `DELETE /api/tasks/:id` no backend  
**Necessita spec futura:** Não

---

### T-02 · Bloqueio de datas passadas

**Status:** ✅ Confirmado — já implementado (parcialmente)  
**Evidências:**  
- `TelaTarefas.tsx` L265–272: `validarDataBR` verifica `data < hoje` e retorna erro "Não é possível criar tarefas para datas passadas".  
- **Já existe** bloqueio na criação. O que não existe é: (a) DatePicker nativo, (b) validação ao editar tarefa existente.  

**Status revisado:** Parcialmente resolvido para criação. Edição de tarefa não existe ainda.  
**Necessita spec futura:** Não

---

### T-03 · Evolução do modelo de dados

**Status:** ✅ Confirmado — modelo limitado  
**Evidências:**  
- `types/index.ts`: `Tarefa` tem `titulo`, `descricao?`, `concluida`, `data?`, `dataCriacao`. Sem `categoria`, `prioridade`, `tags`.  
- `descricao` existe no tipo mas **não está exposta no modal** de criação (`ModalNovaTarefa` aceita só título e data).  

**Complexidade estimada:** Média (requer migration de schema no backend)  
**Necessita spec futura:** Sim — definir quais campos adicionar e prioridade de cada

---

### T-04 · Categorias

**Status:** ⚠️ Hipótese — não implementado  
**Evidências:** Campo inexistente no modelo e na UI.  
**Complexidade estimada:** Alta (modelo + migration + UI de seleção de categoria)  
**Necessita spec futura:** Sim

---

### T-05 · Descrições mais completas

**Status:** ✅ Resolvido (adicionado campo descricao opcional no modal de criação e renderizado no ItemTarefa)  
**Evidências:** `ModalNovaTarefa` não expõe campo de descrição apesar de `Tarefa.descricao` existir no tipo e ser enviado via `adicionarTarefa`.  
**Complexidade estimada:** Baixa (adicionar TextInput no modal)  
**Necessita spec futura:** Não

---

### T-06 · Integração com contexto

**Status:** ⚠️ Hipótese — dependência de EV-03  
**Complexidade estimada:** Alta  
**Necessita spec futura:** Sim

---

### T-07 · Avaliar necessidade de migration

**Status:** ✅ Confirmado — necessária antes de evoluções de modelo  
**Evidências:** Qualquer adição de campo à tabela `tasks` no backend requer migration. Quanto mais tarde for feita, maior o risco.  
**Complexidade estimada:** Baixa-Média (depende do que for adicionado)  
**Necessita spec futura:** Sim — decisão técnica de quais campos entram em qual sprint

---

### T-08 · Calendário

**Status:** ⚠️ Evolução — não há base implementada  
**Complexidade estimada:** Alta  
**Necessita spec futura:** Sim

---

## Chat

### C-01 · Persistência local da conversa atual

**Status:** ✅ Resolvido (salva mensagens e conversationId no AsyncStorage)  
**Evidências:**  
- `TelaChat.tsx` L211: `useState<MensagemChat[]>([])` — estado volátil.  
- Ao trocar de aba ou fechar o app, toda a conversa e o `conversationId` são perdidos.  
- Nenhuma leitura/escrita de AsyncStorage em `TelaChat.tsx`.  

**Complexidade estimada:** Baixa-Média  
**Dependências:** Nenhuma de backend (AsyncStorage local)  
**Necessita spec futura:** Não para persistência básica; sim para histórico multi-conversa

---

### C-02 · Estratégias futuras para histórico

**Status:** ⚠️ Evolução  
**Evidências:** `conversation_id` retornado pela API (L263) sugere que o backend já suporta múltiplas conversas. A UI não expõe isso.  
**Complexidade estimada:** Alta  
**Necessita spec futura:** Sim

---

### C-03 · Adicionar mensagens ao contexto

**Status:** ✅ Confirmado — ausente  
**Evidências:** Sem nenhum botão/gesto de "salvar mensagem como memória" em `TelaChat.tsx`. O único caminho de geração de contexto é via Diário.  
**Complexidade estimada:** Média  
**Necessita spec futura:** Sim — definir UX de seleção de trecho

---

## Perfil

### P-01 · Foto de perfil personalizada

**Status:** ✅ Confirmado — ausente  
**Evidências:**  
- `TelaPerfil.tsx` L314–321: `<Image source={require('../../assets/logoshello.jpeg')} />` fixo.  
- Sem botão de edição de avatar, sem integração com câmera ou galeria.  

**Complexidade estimada:** Média (image picker + upload + storage)  
**Dependências:** Endpoint de upload no backend + biblioteca de image picker  
**Necessita spec futura:** Sim

---

### P-02 · Integração da identidade visual do usuário

**Status:** ⚠️ Hipótese — depende de P-01  
**Complexidade estimada:** Alta  
**Necessita spec futura:** Sim

---

## UX

### U-01 · Responsividade

**Status:** ⚠️ Necessita investigação em dispositivos físicos  
**Evidências preliminares:**  
- Layouts usam `padding`, `gap`, `flex` do design system. Sem media queries ou breakpoints.  
- `SafeAreaView` com `edges` usados corretamente na maioria das telas.  
- `KeyboardAvoidingView` presente em `TelaChat`, `TelaEntradaDiario`, `TelaTarefas`.  

**Complexidade estimada:** Variável — depende de quais dispositivos apresentam problemas  
**Necessita spec futura:** Não — requer testes em devices reais

---

### U-02 · Botões não funcionando em alguns cenários

**Status:** 🔍 Hipótese — sem evidências concretas no código  
**Evidências preliminares:**  
- BUG-05 (ChatTab) pode mascarar a sensação de botão não funcionando.  
- `disabled` com `opacity` aplicado em vários botões (ex: `botaoAdicionarModalDesabilitado`).  
- Nenhum bug óbvio de `onPress` ausente encontrado na análise estática.  

**Necessita spec futura:** Não — requer reprodução do cenário específico

---

### U-03 · Feedback visual da navegação inferior

**Status:** ✅ Resolvido (ChatTab com destaque visual ativo/inativo dinâmico)  
**Evidências:** Ver BUG-05. Demais abas têm mudança de cor mas sem micro-animações.  
**Complexidade estimada:** Baixa-Média  
**Necessita spec futura:** Não

---

### U-04 · Transições entre telas

**Status:** ✅ Confirmado — transições padrão sem customização  
**Complexidade estimada:** Baixa-Média  
**Necessita spec futura:** Não para transições básicas; sim para animações elaboradas

---

### U-05 · Consistência de animações

**Status:** ⚠️ Hipótese — parcialmente analisado  
**Evidências preliminares:**  
- Várias Animated.Value com durações inconsistentes (300ms, 700ms, 80ms, 130ms).  
- `ShimmerLoader` no Chat usa 700ms. `ItemTarefa` usa 80ms+130ms. `PulseIALendo` usa 700ms.  
- Sem guideline documentada de duração/easing.  

**Complexidade estimada:** Baixa  
**Necessita spec futura:** Sim — definir padrão de animações no design system

---

### U-06 · Revisão da Home

**Status:** ✅ Confirmado — melhorias identificadas  
**Evidências:**  
- FAB com ponto de notificação estático (UX-02).  
- Atalhos não cobrem Chat (UX-08).  
- Home não exibe tarefas pendentes ou próximas.  

**Complexidade estimada:** Baixa-Média  
**Necessita spec futura:** Não para os itens identificados

---

### U-07 · Uso correto dos sprites do Shello

**Status:** ✅ Resolvido (expressões dinâmicas baseadas na mensagem mapeadas no client)  
**Evidências:** Ver UX-09. `expressao` hardcoded como `'neutro'` em `TelaChat.tsx` L261.  
**Complexidade estimada:** Baixa-Média (requer API retornar expressão ou lógica client-side)  
**Necessita spec futura:** Sim — definir quando cada expressão é usada

---

### U-08 · Remoção de diálogos nativos Android

**Status:** ✅ Resolvido (DialogShello customizado criado e aplicado)  
**Evidências:** `Alert.alert` encontrado em `TelaPerfil.tsx` (logout e salvamento de nome). Necessário componente de dialog customizado do Shello.  
**Complexidade estimada:** Baixa-Média  
**Necessita spec futura:** Não
