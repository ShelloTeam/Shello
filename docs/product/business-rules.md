# Regras de Negócio — Shello

> **Audiência:** Desenvolvedores e agentes de IA. Todas as regras aqui descritas são autoritativas e devem ser
> implementadas sem exceção. Qualquer divergência entre código e este documento deve ser tratada como bug.

---

## 1. Chat

### 1.1 Limite de Mensagens
- **Regra:** Cada conversa ativa suporta no máximo **20 mensagens**.
- **Comportamento ao atingir o limite:** nova mensagem não é aceita até que a conversa seja arquivada e uma nova seja iniciada.

### 1.2 Arquivamento Automático
- Conversa com **inatividade > 2 horas** é arquivada automaticamente.
- O job de arquivamento executa **a cada 15 minutos** via APScheduler.
- Uma conversa arquivada não pode receber novas mensagens — deve-se criar uma nova conversa.

### 1.3 Modos de Operação
O agente opera em dois modos, detectados automaticamente por keywords na mensagem do usuário:

| Modo | Trigger (exemplos de keywords) | Comportamento |
|---|---|---|
| `PRATICO` | "criar tarefa", "lembrete", "agenda", "adicionar" | Executa ações estruturadas (criar tarefa, registrar no diário) |
| `PADRAO` | Qualquer mensagem sem keywords de ação | Conversação geral, respostas narrativas |

### 1.4 Moderação de Respostas
- Resposta **bloqueada pela moderação** (ex.: conteúdo inapropriado detectado pela API da OpenAI) **não é salva** no banco de dados.
- O endpoint retorna `{"blocked": true}` e nenhum registro de mensagem é criado.

### 1.5 Indisponibilidade do LLM
- Se a OpenAI estiver indisponível ou retornar erro, o endpoint retorna **HTTP 503 Service Unavailable**.
- Nenhuma mensagem parcial é salva.

### 1.6 Composição do Prompt
O prompt enviado à OpenAI é composto por **6 blocos obrigatórios**, nesta ordem:

1. **IDENTIDADE** — Quem é o Shello e seu propósito.
2. **PARÂMETROS** — Configurações do usuário (formalidade, nome_referencia).
3. **CONTEXTO** — Fragmentos de contexto recuperados do banco.
4. **MODO** — Modo de operação detectado (`PRATICO` ou `PADRAO`).
5. **HISTÓRICO** — Mensagens anteriores da conversa, truncadas a **1.500 tokens**.
6. **Mensagem do usuário** — A mensagem atual.

> **IMPORTANTE:** A ausência de qualquer bloco é considerada falha de implementação.

### 1.7 Fragmentos de Contexto no Prompt
- Máximo de **20 fragmentos** por chamada.
- Ordenados por `created_at ASC` (mais antigo primeiro).
- Apenas fragmentos com `is_active = True` são incluídos.

---

## 2. Diário de Anotações

### 2.1 Validação de Conteúdo
- Conteúdo **vazio** é rejeitado com **HTTP 422 Unprocessable Entity**.
- Conteúdo com mais de **10.000 caracteres** é rejeitado com HTTP 422.

### 2.2 Extração Assíncrona de Fragmentos
- Anotações com **mais de 100 caracteres** disparam extração assíncrona de fragmentos de contexto.
- A extração **não bloqueia** a resposta ao cliente — é disparada via `asyncio.create_task()`.
- **Proibido:** usar `await` direto na extração dentro do handler de request.

```python
# CORRETO
asyncio.create_task(extract_fragments(entry_id, content))

# PROIBIDO
await extract_fragments(entry_id, content)
```

### 2.3 Autorização
- `DELETE` ou `PUT` em anotação pertencente a **outro usuário** retorna **HTTP 403 Forbidden**.
- RLS no Supabase é a segunda linha de defesa, mas a validação de ownership no service é obrigatória.

### 2.4 Busca
- Busca de anotações usa `ILIKE` no campo `content` (case-insensitive, parcial).

### 2.5 Listagem
- Retorno paginado, agrupado por data de criação (`created_at::date`).

---

## 3. Tarefas

### 3.1 CRUD
- Operações disponíveis: Create, Read, Update, Delete.
- Status válidos: `pending` | `done`.

### 3.2 Regra D06 — Due Date via Chat (MVP)
> **Esta é uma regra crítica do MVP e não deve ser alterada sem um novo ADR.**

- Tarefa criada via chat (endpoint `/api/tasks/from-chat`) tem `due_date` **SEMPRE `null`**.
- O sistema **nunca** tenta parsear ou inferir uma data a partir do texto livre do usuário.
- O usuário define a data manualmente pela interface de edição da tarefa.
- **Justificativa:** parsear datas em português natural é propenso a erros e está fora do escopo do MVP.

### 3.3 Limite por Chamada via Chat
- O endpoint `/api/tasks/from-chat` cria no máximo **3 tarefas por chamada**.

---

## 4. Fragmentos de Contexto (Memórias)

### 4.1 Criação
- Fragmentos são extraídos automaticamente do conteúdo do diário.
- No momento da extração, `is_active = False` (ficam inativos até revisão/ativação).
- Fragmentos derivados de anotações de diário têm `derived_from_conversation_id = null`.

### 4.2 Conteúdo
- Máximo de **300 caracteres** por fragmento.
- Redigidos em **terceira pessoa** (ex.: "O usuário prefere acordar às 7h").
- **Sem conteúdo emocional** — apenas fatos e preferências observáveis.

### 4.3 Categorias Válidas
| Categoria | Descrição |
|---|---|
| `preferencia` | Gosto, preferência ou aversão declarada |
| `rotina` | Hábito ou padrão de comportamento |
| `contexto` | Informação situacional relevante |

> Outras categorias podem ser adicionadas via ADR.

---

## 5. Preferências do Usuário

| Campo | Tipo | Valores Válidos | Efeito |
|---|---|---|---|
| `formalidade` | enum | `baixa` \| `media` \| `alta` | Altera o tom do agente (informal → formal) |
| `nome_referencia` | string | Max 30 chars | Nome que o agente usa para chamar o usuário |
| `theme` | enum | `light` \| `dark` | Sincronizado pelo servidor, aplicado no frontend |

---

## 6. Segurança

### 6.1 Row Level Security (RLS)
RLS está **ativo e obrigatório** nas seguintes tabelas do Supabase:

1. `users`
2. `diary_entries`
3. `tasks`
4. `conversations`
5. `messages`
6. `context_fragments`
7. `onboarding_answers`

> Desabilitar RLS em qualquer dessas tabelas em produção é uma **vulnerabilidade crítica**.

### 6.2 Autenticação
- JWT transmitido via **cookie HTTPOnly** ou header `Authorization: Bearer <token>`.
- Token expira em **7 dias**.
- Renovação de token é responsabilidade do cliente.

### 6.3 Secrets
- `OPENAI_API_KEY` **nunca** deve aparecer em logs, responses, ou tracebacks.
- Configurar mascaramento no Sentry e no logger do Railway.

---

## 7. Custo de Tokens (IA)

### 7.1 Modelo
- Modelo fixo: **`gpt-4o-mini-2024-07-18`**.
- Temperatura fixa: **`0.7`**.
- **Proibido** tornar modelo ou temperatura configuráveis por variável de ambiente.

### 7.2 Preços de Referência (a verificar em billing da OpenAI)
| Tipo | Preço |
|---|---|
| Input tokens | $0.150 / 1M tokens |
| Output tokens | $0.600 / 1M tokens |

### 7.3 Alerta de Custo
- Se o custo de um usuário superar **$0.50/dia**, o `CostTracker` deve emitir alerta.
- O alerta não bloqueia o usuário — apenas notifica os administradores.
