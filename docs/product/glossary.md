# Glossário — Shello

> Termos técnicos e de domínio usados no projeto. Este glossário é a fonte autoritativa de nomenclatura.
> Agentes de IA e desenvolvedores devem usar estes termos de forma consistente em código, testes e documentação.

---

## Shello
O assistente pessoal inteligente. É o produto em si e também o nome do agente conversacional que interage
com o usuário. O Shello responde mensagens, cria tarefas e armazena memórias derivadas do diário.

---

## Conversa Ativa
Uma conversa (`conversation`) com `status = "active"`. Aceita novas mensagens enquanto:
- Tem menos de 20 mensagens.
- Teve atividade nas últimas 2 horas.

Ao ser arquivada, o `status` muda para `"archived"` e ela não aceita mais mensagens.

---

## Fragmento de Contexto
Unidade atômica de memória extraída de uma anotação de diário ou de uma conversa relevante.
Armazenado na tabela `context_fragments` com:
- Conteúdo em terceira pessoa (max 300 chars).
- Uma categoria (`preferencia`, `rotina`, `contexto`, etc.).
- Flag `is_active` que determina se será injetado no prompt.

Sinônimo coloquial: **memória**.

---

## Modo PRATICO
Modo de operação do agente ativado quando a mensagem do usuário contém keywords de ação
(ex.: "criar tarefa", "lembrete", "adicionar"). Neste modo, o Shello executa operações estruturadas
no banco de dados (criar tarefa, salvar anotação) além de responder em linguagem natural.

---

## Modo PADRAO
Modo de operação padrão do agente, ativo quando nenhuma keyword de ação é detectada.
O Shello responde de forma conversacional, sem executar operações estruturadas.

---

## Onboarding
Fluxo de configuração inicial pelo qual o usuário passa na primeira vez que abre o app.
Coleta informações como nome, preferências de formalidade e outros dados iniciais armazenados
na tabela `onboarding_answers`. Define o `nome_referencia` e a `formalidade` do usuário.

---

## Formalidade
Preferência do usuário que controla o tom das respostas do Shello.
Valores possíveis: `baixa` (informal, descontraído), `media` (equilibrado), `alta` (formal, profissional).
Injetado no bloco PARÂMETROS do prompt.

---

## Nome de Referência (`nome_referencia`)
Como o Shello chama o usuário durante a conversa. Definido no onboarding ou nas preferências.
Máximo de 30 caracteres. Injetado no bloco PARÂMETROS do prompt.

---

## Anotação / Diário
Uma entrada de texto livre criada pelo usuário na funcionalidade de diário, armazenada na tabela
`diary_entries`. Cada anotação pode disparar a extração assíncrona de fragmentos de contexto
se tiver mais de 100 caracteres.

---

## Tarefa
Item de ação do usuário, armazenado na tabela `tasks`. Possui título, status (`pending` | `done`)
e opcionalmente `due_date`. Tarefas criadas via chat têm `due_date = null` por regra do MVP (D06).

---

## Histórico Unificado
O conjunto de mensagens da conversa atual passado para o LLM. Inclui mensagens do usuário e do
assistente, truncado a **1.500 tokens** para caber dentro do limite de contexto com folga.
Não confundir com o histórico completo da conversa no banco (que pode ter até 20 mensagens).

---

## Extração
Processo assíncrono que analisa o conteúdo de uma anotação de diário e gera fragmentos de contexto
relevantes usando o LLM. Disparado via `asyncio.create_task()` após a criação/atualização de uma
anotação com mais de 100 caracteres.

---

## Prompt Builder
Componente (função ou classe) responsável por montar o prompt completo enviado à OpenAI,
respeitando a estrutura de 6 blocos: IDENTIDADE, PARÂMETROS, CONTEXTO, MODO, HISTÓRICO e
mensagem do usuário.

---

## RLS (Row Level Security)
Mecanismo do PostgreSQL (configurado via Supabase) que garante que cada usuário só acessa
os próprios dados. É a principal camada de isolamento de dados entre usuários. Ativo em 7 tabelas.
Ver: [`business-rules.md` — Seção 6.1](business-rules.md#61-row-level-security-rls).

---

## Cost Tracker
Componente responsável por contabilizar o gasto de tokens (input + output) por usuário por dia.
Emite alerta quando o custo supera $0.50/dia/usuário. Não bloqueia o usuário.
