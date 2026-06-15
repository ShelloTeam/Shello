# Candidatos para a Próxima Sprint

> Critérios de seleção: **alto impacto** · **baixa ou média complexidade** · **poucas dependências**  
> Gerado em: 2026-06-14

---

## Critérios de Qualificação

| Critério            | Definição                                                  |
| ------------------- | ---------------------------------------------------------- |
| Alto impacto        | Afeta funcionalidade básica ou experiência core do usuário |
| Baixa complexidade  | Frontend-only ou endpoint simples no backend               |
| Média complexidade  | Requer 1–2 endpoints novos ou extensão moderada de UI      |
| Poucas dependências | Não bloqueia nem é bloqueado por outros itens pendentes    |

---

## ✅ Candidatos Qualificados

### 1. BUG-01 + BUG-02 — Exclusão de Entradas e Tarefas

|                  |                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Referência**   | BUG-01 (Diário) + BUG-02 (Tasks)                                                                          |
| **Impacto**      | Alto — CRUD básico ausente                                                                                |
| **Complexidade** | Baixa                                                                                                     |
| **Dependências** | Endpoints `DELETE /api/diary/:id` e `DELETE /api/tasks/:id` no backend                                    |
| **Entregável**   | Botão de exclusão com confirmação na `TelaEntradaDiario` + swipe-to-delete ou long-press na `TelaTarefas` |

**Por que entra:** São os gaps de CRUD mais críticos do produto. Um usuário que cria algo por engano não tem saída. Ambos seguem o mesmo p# Shello - Consolidação Inicial do Backlog de Fixes

Você está iniciando uma fase de análise focada exclusivamente na consolidação do backlog de correções e melhorias já identificadas pela equipe.

O projeto já possui documentação, visão de produto, arquitetura e direcionamento estratégico.

NÃO produza documentação genérica do produto.

NÃO produza roadmap.

NÃO implemente código.

NÃO realize refatorações.

Seu objetivo é transformar a lista atual de problemas, observações e sugestões em um backlog técnico consistente e acionável.

---

# Objetivo

Criar uma visão clara dos problemas atualmente conhecidos antes de iniciar qualquer sprint de implementação.

Queremos entender:

- O que já está confirmado.
- O que é apenas hipótese.
- O que está duplicado.
- O que depende de investigação.
- O que realmente deve entrar na próxima sprint.

---

# Processo

Para cada item do backlog:

## Validar

Investigar se o problema realmente existe.

Documentar:

- Evidências encontradas.
- Fluxo atual.
- Arquivos envolvidos.
- Impacto para o usuário.

---

## Consolidar

Agrupar itens relacionados.

Exemplo:

### Context Fragments

- Duplicação ao adicionar contexto.
- Modal para grandes volumes.
- Integração futura com chat.
- Integração futura com tasks.

Devem ser agrupados em um mesmo domínio funcional.

---

## Classificar

Marcar cada item como:

### Bug

Algo que deveria funcionar mas não funciona.

### UX

Algo funcional porém com experiência ruim.

### Débito Técnico

Limitação técnica que dificulta evolução.

### Evolução

Nova capacidade do produto.

---

# Itens Conhecidos para Investigação

## Context Fragments

- Atualizar fragmentos existentes ao invés de criar duplicações.
- Avaliar escalabilidade da visualização.
- Necessidade de modal para grandes quantidades de registros.

---

## Diário

- Exclusão de entradas.
- Melhor navegação.
- Busca.
- Filtros.
- Revisão de fluxos redundantes.
- Possível duplicidade de botões.

---

## Tasks

- Exclusão de tarefas.
- Bloqueio de datas passadas.
- Evolução do modelo de dados.
- Categorias.
- Descrições mais completas.
- Integração com contexto.
- Avaliar necessidade de migration.
- Calendário.

---

## Chat

- Persistência local da conversa atual.
- Estratégias futuras para histórico.
- Possibilidade de adicionar mensagens ao contexto.

---

## Perfil

- Foto de perfil personalizada.
- Integração da identidade visual do usuário ao produto.

---

## UX

- Responsividade.
- Botões não funcionando em alguns cenários.
- Feedback visual da navegação inferior.
- Transições entre telas.
- Consistência de animações.
- Revisão da Home.
- Uso correto dos sprites do Shello.
- Remoção de diálogos nativos Android.

---

# Entregáveis

Produzir:

## docs/backlog-consolidated.md

Contendo:

### Bugs

### UX

### Débitos Técnicos

### Evoluções

---

## docs/backlog-investigation.md

Para cada item:

- Status atual.
- Evidências.
- Complexidade estimada.
- Dependências.
- Necessidade de spec futura.

---

## docs/sprint-candidates.md

Listar apenas os itens que possuem:

- Alto impacto.
- Baixa ou média complexidade.
- Poucas dependências.

Esses serão os candidatos naturais para a próxima sprint.

---

# Importante

Não implemente nada.

Não proponha arquitetura nova.

Não faça redesign do produto.

O foco desta etapa é apenas transformar observações da equipe em um backlog técnico limpo, validado e priorizável.
adrão de implementação e podem ser feitos na mesma sprint.

---

### 2. BUG-04 + CF-01 — Persistência e deduplicação de `adicionadaAoContexto`

|                  |                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Referência**   | BUG-04 + CF-01                                                                                 |
| **Impacto**      | Médio — feedback falso ao usuário sobre o que está no contexto                                 |
| **Complexidade** | Baixa (fix técnico no mapper + lógica de comparação)                                           |
| **Dependências** | Alinhamento de contrato com backend para retornar o campo                                      |
| **Entregável**   | `mapDiaryEntry` que preserva o estado; `conteudoSimilar` com janela de comparação mais precisa |

**Por que entra:** Baixíssimo custo de implementação para corrigir um bug visível ao usuário. A deduplicação mais robusta pode ser feita client-side sem mudança de API.

---

### 3. BUG-05 + UX-03 — Feedback visual da tab ativa (ChatTab)

|                  |                                                             |
| ---------------- | ----------------------------------------------------------- |
| **Referência**   | BUG-05 + UX-07                                              |
| **Impacto**      | Médio — confunde usuário sobre estado da navegação          |
| **Complexidade** | Baixa — mudança de 2 linhas no `NavegacaoAbas.tsx`          |
| **Dependências** | Nenhuma                                                     |
| **Entregável**   | ChatTab com ícone que muda de aparência no estado `focused` |

**Por que entra:** Custo de implementação praticamente zero. `color={focused ? ShelloTema.cores.superficie : ShelloTema.cores.marcaClaro}` resolve. Não implementar seria deixar um bug trivial aberto.

---

### 4. BUG-06 — Remoção de `Alert.alert` nativo

|                  |                                                                           |
| ---------------- | ------------------------------------------------------------------------- |
| **Referência**   | BUG-06 + U-08                                                             |
| **Impacto**      | Médio — quebra consistência visual                                        |
| **Complexidade** | Baixa-Média (criar componente de dialog customizado reutilizável)         |
| **Dependências** | Nenhuma                                                                   |
| **Entregável**   | Componente `DialogShello` + uso nos fluxos de logout e salvamento de nome |

**Por que entra:** Cria um componente reutilizável que será necessário em outros fluxos (exclusão de entradas, exclusão de tarefas). Melhor construir agora e já usar.

---

### 5. T-05 — Exposição do campo Descrição no Modal de Tasks

|                  |                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| **Referência**   | T-05                                                                            |
| **Impacto**      | Médio — campo já existe no tipo e no backend mas é inacessível                  |
| **Complexidade** | Baixa — adicionar TextInput no `ModalNovaTarefa`                                |
| **Dependências** | Nenhuma — `Tarefa.descricao` e `adicionarTarefa(titulo, descricao?)` já existem |
| **Entregável**   | Campo de descrição opcional no modal de criação de tarefa                       |

**Por que entra:** Custo mínimo, valor imediato. A infraestrutura já está pronta no contexto e no backend.

---

### 6. UX-09 — Expressões do mascote Shello variando no Chat

|                  |                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Referência**   | UX-09 + U-07                                                                                                    |
| **Impacto**      | Médio — mascote perde personalidade sem variação de expressão                                                   |
| **Complexidade** | Baixa-Média (lógica client-side sem dependência de backend)                                                     |
| **Dependências** | Nenhuma — o sprite sheet e o sistema de expressões já existem                                                   |
| **Entregável**   | Lógica de mapeamento de contexto/sentimento da resposta → expressão; ou, como MVP, variação aleatória ponderada |

**Por que entra:** O sprite sheet já está pronto. O tipo `ExpressaoShello` já existe. O custo de não implementar é que um asset caro (4 frames de expressão do mascote) está completamente ocioso.

---

### 7. C-01 — Persistência local da conversa de Chat

|                  |                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------- |
| **Referência**   | C-01                                                                                         |
| **Impacto**      | Alto — toda conversa é perdida ao trocar de aba                                              |
| **Complexidade** | Baixa-Média                                                                                  |
| **Dependências** | Nenhuma de backend — apenas AsyncStorage                                                     |
| **Entregável**   | Serialização de `mensagens` e `conversationId` em AsyncStorage; restauração ao montar a tela |

**Por que entra:** Impacto alto no usuário (perder conversa ao mudar de aba é uma fricção severa) e sem dependências externas.

---

### 8. DT-02 — Mover tokens de cor para o `ShelloTema`

|                  |                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Referência**   | DT-02                                                                                                                                 |
| **Impacto**      | Médio — inconsistências de cor ativas entre arquivos                                                                                  |
| **Complexidade** | Baixa                                                                                                                                 |
| **Dependências** | Nenhuma                                                                                                                               |
| **Entregável**   | Tokens `terracota`, `pessego`, `pessegoDark` adicionados ao `ShelloTema` + substituição dos hardcodes em `HomeScreen` e `TelaTarefas` |

**Por que entra:** Custo zero. Elimina TODO documentado no código e previne novos hardcodes. Sem esse fix, toda nova tela que usar terracota vai perpetuar o problema.

---

## ❌ Excluídos desta Sprint

| Item                                   | Razão da Exclusão                                                  |
| -------------------------------------- | ------------------------------------------------------------------ |
| T-04 (Categorias)                      | Alta complexidade + migration + spec necessária                    |
| T-08 (Calendário)                      | Alta complexidade + spec necessária                                |
| C-02 (Histórico de Chat)               | Alta complexidade + spec necessária                                |
| P-01 (Foto de perfil)                  | Dependência de backend (upload) + biblioteca externa               |
| P-02 (Identidade visual)               | Depende de P-01                                                    |
| EV-03 (Tasks ↔ Contexto)               | Alta complexidade + spec necessária                                |
| DT-04 (Componentização)                | Refatoração ampla — sprint própria                                 |
| DT-05 (Hooks)                          | Refatoração ampla — sprint própria                                 |
| CF-02/CF-03 (Modal de memórias)        | Hipótese sem dados reais; spec necessária                          |
| U-01 (Responsividade)                  | Requer testes em dispositivos físicos                              |
| U-02 (Botões com falha)                | Sem cenário de reprodução identificado                             |
| T-07 (Migration)                       | Decisão técnica que precede categorias/prioridade — entra com T-04 |
| D-02/D-04 (Filtros/Navegação avançada) | Spec necessária para modelo de UX                                  |
| UX-04 (Transições customizadas)        | Spec de animações necessária (U-05)                                |

---

## Resumo

| #   | Item                                                     | Tipo     | Complexidade | Status       |
| --- | -------------------------------------------------------- | -------- | ------------ | ------------ |
| 1   | BUG-01 + BUG-02 — Exclusão de entradas e tarefas         | Bug      | Baixa        | ✅ Concluído |
| 2   | BUG-04 + CF-01 — Persistência e deduplicação de contexto | Bug + DT | Baixa        | ✅ Concluído |
| 3   | BUG-05 — Feedback de aba ativa ChatTab                   | Bug      | Baixa        | ✅ Concluído |
| 4   | BUG-06 + U-08 — Dialog customizado (sem Alert nativo)    | Bug + UX | Baixa-Média  | ✅ Concluído |
| 5   | T-05 — Descrição no modal de Tasks                       | UX       | Baixa        | ✅ Concluído |
| 6   | UX-09 — Expressões variadas do mascote                   | UX       | Baixa-Média  | ✅ Concluído |
| 7   | C-01 — Persistência do Chat em AsyncStorage              | Bug      | Baixa-Média  | ✅ Concluído |
| 8   | DT-02 — Tokens de cor no ShelloTema                      | DT       | Baixa        | ✅ Concluído |
