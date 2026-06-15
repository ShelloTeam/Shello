# Backlog Consolidado — Shello

> Gerado em: 2026-06-14  
> Escopo: análise estática do código-fonte + revisão dos domínios funcionais

---

## 🐛 Bugs

### BUG-01 · Exclusão de entradas do Diário ausente (✅ Resolvido)
**Domínio:** Diário  
**Arquivo:** `ShelloContext.tsx`, `TelaDiario.tsx`, `TelaEntradaDiario.tsx`  
**Descrição:** Não existe função `removerEntrada` no `ShelloContextData` nem chamada `DELETE /api/diary/:id`. A tela de edição não expõe nenhum botão ou gesto de exclusão. O usuário não tem como apagar uma entrada.  
**Impacto:** Alto — funcionalidade CRUD básica ausente.

---

### BUG-02 · Exclusão de tarefas ausente (✅ Resolvido)
**Domínio:** Tasks  
**Arquivo:** `ShelloContext.tsx`, `TelaTarefas.tsx`  
**Descrição:** O contexto expõe apenas `adicionarTarefa` e `alternarTarefa`. Não há `removerTarefa` nem botão/gesto de exclusão. Tarefas criadas por engano ou obsoletas ficam permanentemente na lista.  
**Impacto:** Alto.

---

### BUG-03 · Context Fragments: duplicação ao adicionar ao contexto (✅ Resolvido)
**Domínio:** Context Fragments (Memórias)  
**Arquivo:** `ShelloContext.tsx` — `marcarEntradaComoContexto`  
**Descrição:** A lógica anti-duplicata compara apenas os primeiros 60 chars normalizados. Entradas com conteúdo parecido mas não idêntico nos primeiros 60 chars criam memórias duplicadas.  
**Impacto:** Médio — memórias duplicadas poluem o contexto da IA.

---

### BUG-04 · `adicionadaAoContexto` não persiste entre sessões (✅ Resolvido)
**Domínio:** Diário / Context Fragments  
**Arquivo:** `ShelloContext.tsx` — `mapDiaryEntry` (L63)  
**Descrição:** O mapper sempre retorna `adicionadaAoContexto: false`. O badge "No contexto do Shello" desaparece ao recarregar o app. O backend não retorna campo equivalente.  
**Impacto:** Médio — feedback falso ao usuário.

---

### BUG-05 · ChatTab sem feedback visual de aba ativa (✅ Resolvido)
**Domínio:** UX / Navegação  
**Arquivo:** `NavegacaoAbas.tsx` (L62–70)  
**Descrição:** O ícone do ChatTab usa `color="#FFFFFF"` hardcoded tanto no estado `focused` quanto `unfocused`. O botão central nunca muda de aparência para indicar aba ativa.  
**Impacto:** Médio — usuário não sabe se está na tela de Chat.

---

### BUG-06 · `Alert.alert` nativo usado em fluxos críticos (✅ Resolvido)
**Domínio:** UX / Perfil  
**Arquivo:** `TelaPerfil.tsx`  
**Descrição:** Uso de `Alert.alert` nativo do React Native nos fluxos de logout e salvamento de nome — diálogo padrão Android/iOS sem identidade visual do Shello.  
**Impacto:** Médio — quebra a consistência visual.

---

## 🎨 UX

### UX-01 · Diário sem busca ou filtros (✅ Resolvido)
**Domínio:** Diário  
**Arquivo:** `TelaDiario.tsx`  
**Descrição:** Sem campo de busca textual nem filtros. Com volume crescente de entradas, a navegação por scroll linear se torna impraticável.  
**Impacto:** Alto a longo prazo.

---

### UX-02 · Ponto de notificação do FAB sempre visível (decorativo)
**Domínio:** Home  
**Arquivo:** `HomeScreen.tsx`  
**Descrição:** O ponto laranja de notificação é estático — sempre visível, sem lógica condicional. Gera expectativa falsa no usuário.  
**Impacto:** Baixo-médio.

---

### UX-03 · Foto de perfil sem personalização
**Domínio:** Perfil  
**Arquivo:** `TelaPerfil.tsx`  
**Descrição:** O avatar exibe sempre `logoshello.jpeg`. Não há mecanismo para o usuário definir foto de perfil. Nenhum botão de edição de avatar exposto.  
**Impacto:** Médio.

---

### UX-04 · Transições entre telas sem animação personalizada
**Domínio:** Navegação  
**Descrição:** Navegação usa transições padrão do React Navigation sem customização. Sem animações coerentes com o design system do Shello (suave, orgânico).  
**Impacto:** Médio.

---

### UX-05 · Ausência de botão de exclusão na tela de edição de entrada (✅ Resolvido)
**Domínio:** Diário  
**Arquivo:** `TelaEntradaDiario.tsx`  
**Descrição:** A barra superior tem voltar + título + espaçador, mas não há botão de exclusão em modo de edição. Complementa BUG-01 com a perspectiva de onde o acesso deve aparecer.  
**Impacto:** Alto.

---

### UX-06 · Input de data por texto sem DatePicker nativo
**Domínio:** Tasks  
**Arquivo:** `TelaTarefas.tsx` — `ModalNovaTarefa`  
**Descrição:** Campo de data usa máscara `dd/mm/aaaa` digitada manualmente. Não há DatePicker nativo — mais propenso a erros e menos fluido no mobile.  
**Impacto:** Médio.

---

### UX-07 · Feedback visual de aba ativa incompleto (além do ChatTab)
**Domínio:** Navegação  
**Arquivo:** `NavegacaoAbas.tsx`  
**Descrição:** Além da mudança de cor do ícone/label, não há micro-animação ou highlight de seleção para as demais abas.  
**Impacto:** Baixo — polimento.

---

### UX-08 · Home: atalhos rápidos não incluem Chat (✅ Resolvido)
**Domínio:** Home  
**Arquivo:** `HomeScreen.tsx`  
**Descrição:** Cards de atalho cobrem Diário e Tarefas. Chat está acessível apenas via FAB (não óbvio na primeira visita). Perfil sem atalho na Home.  
**Impacto:** Baixo — descoberta de funcionalidades.

---

### UX-09 · Expressão do mascote fixada em 'neutro' após respostas da IA (✅ Resolvido)
**Domínio:** Chat  
**Arquivo:** `TelaChat.tsx` (L261)  
**Descrição:** `const expressao: ExpressaoShello = 'neutro'` hardcoded após cada resposta. O sprite sheet tem 4 quadros (neutro, duvidoso, surpreso, feliz), mas o mascote nunca varia expressão.  
**Impacto:** Médio — mascote perde personalidade.

---

## 🔧 Débitos Técnicos

### DT-01 · `mockServicos.ts` presente mas não utilizado (dead code)
**Domínio:** Serviços  
**Arquivo:** `src/services/mockServicos.ts`  
**Descrição:** Arquivo completo de serviços mockados não é importado por nenhuma tela ou contexto. Todo o fluxo já usa `api.ts` (backend real).  
**Impacto:** Baixo — dead code que aumenta superfície de manutenção.

---

### DT-02 · Tokens de cor terracota hardcoded fora do tema (✅ Resolvido)
**Domínio:** Design System  
**Arquivo:** `HomeScreen.tsx`, `TelaTarefas.tsx`  
**Descrição:** Constantes locais `COR_TERRACOTA_*` e `COR_PESSEGO_*` replicadas em múltiplos arquivos. Comentário `// TODO: mover para ShelloTema` confirma o débito. O valor hardcoded diverge do token `terracota` do tema.  
**Impacto:** Médio — inconsistências de cor, dificulta manutenção.

---

### DT-03 · `adicionadaAoContexto` sem contrato no backend
**Domínio:** Context Fragments / Diário  
**Arquivo:** `ShelloContext.tsx`  
**Descrição:** Backend não retorna campo equivalente a `adicionadaAoContexto`. O estado não sobrevive a reloads. Requer alinhamento de contrato ou persistência local.  
**Impacto:** Médio.

---

### DT-04 · `components/` vazio — sem componentização
**Domínio:** Arquitetura Frontend  
**Arquivo:** `src/components/` (apenas `.gitkeep`)  
**Descrição:** Todo código de componentes está embutido nas telas (`ItemTarefa`, `CardRotina`, `CardEntrada`, `CardMemoria`, `AvatarShello`, etc). Telas atingem mais de 1000 linhas (TelaTarefas: 1098). Sem extração, reutilização é impossível.  
**Impacto:** Alto — bloqueia manutenção e evolução.

---

### DT-05 · `hooks/` vazio — lógica de negócio misturada com UI
**Domínio:** Arquitetura Frontend  
**Arquivo:** `src/hooks/` (apenas `.gitkeep`)  
**Descrição:** Lógicas como `calcularDiasSequencia`, `estaAtrasada`, `agruparEntradas`, `classificarTipoMemoria`, `conteudoSimilar` estão inline nas telas ou no contexto. Sem hooks, não há separação de concerns e testes unitários são inviáveis.  
**Impacto:** Alto.

---

### DT-06 · Double fetch ao adicionar ao contexto
**Domínio:** Context Fragments  
**Arquivo:** `ShelloContext.tsx` — `marcarEntradaComoContexto`  
**Descrição:** Após `POST /api/memories`, há imediatamente um `GET /api/memories` para ressincronizar. O item retornado pelo POST poderia ser usado para atualização otimista local.  
**Impacto:** Baixo — roundtrip desnecessário.

---

### DT-07 · Modelo de Tasks sem suporte a categorias/prioridade
**Domínio:** Tasks  
**Arquivo:** `types/index.ts` — `Tarefa`  
**Descrição:** O modelo atual não inclui `categoria`, `prioridade`. Evoluções planejadas exigirão migration de schema no backend. Quanto mais tarde a decisão for tomada, maior o risco de breaking change.  
**Impacto:** Médio — débito de modelo de dados.

---

## 🚀 Evoluções

### EV-01 · Persistência local da conversa de Chat (✅ Resolvido)
**Domínio:** Chat  
**Arquivo:** `TelaChat.tsx`  
**Descrição:** `mensagens` é estado volátil — zerado ao trocar de aba ou fechar o app. `conversationId` também é perdido. Estratégia sugerida: AsyncStorage para sessão atual; histórico no backend como evolução posterior.

---

### EV-02 · Adicionar mensagens do Chat ao Contexto
**Domínio:** Chat / Context Fragments  
**Descrição:** Sem mecanismo para marcar trecho de conversa como memória. Necessário fluxo de seleção e confirmação.

---

### EV-03 · Integração Tasks ↔ Contexto
**Domínio:** Tasks / Context Fragments  
**Descrição:** Tarefas criadas não alimentam o contexto da IA. Não há criação de tarefa a partir de memória ou sugestão de contexto (exceto via card de sugestão no Chat).

---

### EV-04 · Categorias e descrições longas em Tasks (⚠️ Parcialmente Resolvido — Descrições implementadas)
**Domínio:** Tasks  
**Arquivo:** `types/index.ts`, `TelaTarefas.tsx`  
**Descrição:** `descricao` existe no tipo mas não está exposta no modal de criação. Categorias ausentes. Requer extensão do modelo + migration.

---

### EV-05 · Calendário para visualização de Tasks
**Domínio:** Tasks  
**Descrição:** Sem visão temporal. O campo `data` já existe no modelo `Tarefa`. Calendário seria evolução natural.

---

### EV-06 · Histórico de conversas de Chat
**Domínio:** Chat  
**Descrição:** Cada conversa começa do zero. O `conversation_id` retornado pela API sugere suporte no backend, mas a UI não expõe múltiplas conversas.

---


### EV-07 · Escalabilidade da visualização de Context Fragments (✅ Resolvido)
**Domínio:** Perfil / Context Fragments  
**Arquivo:** `TelaPerfil.tsx`  
**Descrição:** Lista de memórias sem virtualização em ScrollView. Com volume alto, performance pode degradar. Avaliar modal dedicado ou paginação.

---

### EV-08 · Foto de perfil + identidade visual do usuário
**Domínio:** Perfil  
**Descrição:** Upload de foto de perfil + integração da identidade do usuário ao produto (saudações na Home, avatar no Chat, etc).
