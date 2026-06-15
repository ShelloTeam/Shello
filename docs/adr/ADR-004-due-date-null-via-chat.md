# ADR-004 — Regra D06: Tarefas Criadas via Chat Têm `due_date = null`

## Status

`Accepted`

**Data:** 2026-01-01
**Autor(es):** Time Shello

---

## Contexto

O Shello permite ao usuário criar tarefas por meio de linguagem natural no chat, por exemplo:

> *"Cria uma tarefa para eu ligar para o dentista na próxima segunda"*
> *"Lembra de me avisar do reunião do Pedro amanhã às 10h"*

Para atender a esses comandos no MVP, o sistema precisa:
1. Extrair o título/descrição da tarefa a partir do texto livre.
2. Opcionalmente, extrair a data de vencimento (`due_date`) do texto.

O **ponto 2** apresenta os seguintes problemas no contexto do MVP:

- **Ambiguidade:** "próxima segunda", "amanhã", "em dois dias" requerem cálculo relativo ao momento atual,
  timezone do usuário, e calendário local — complexidade desnecessária para MVP.
- **Variedade linguística:** O português tem múltiplos formatos de data e expressões de tempo relativo
  que exigem parsing robusto (ex.: "depois de amanhã", "semana que vem", "daqui a 3 dias").
- **LLM não é confiável para datas:** Modelos de linguagem cometem erros de cálculo de datas relativas —
  "próxima segunda" pode ser interpretado como a segunda desta semana ou da próxima semana dependendo do
  dia de hoje, e o LLM não tem acesso confiável à data atual.
- **Custo de implementação:** Um parser de datas confiável em português requer biblioteca especializada
  (ex.: `dateutil`, `pendulum`, NLP em português) ou chamada adicional à OpenAI com contexto de data/timezone.

---

## Decisão

**Regra D06 do MVP:** O endpoint `/api/tasks/from-chat` **sempre retorna `due_date = null`**, independentemente
do que o usuário disser no chat.

```python
# app/services/task_service.py
async def create_task_from_chat(
    user_id: str,
    title: str,
    # due_date intencionalmente ausente
) -> dict:
    return await self.repo.create(
        user_id=user_id,
        title=title,
        due_date=None,  # REGRA D06: sempre null, nunca inferido
        status="pending",
    )
```

**Comportamento esperado na UX:**
- A tarefa é criada sem data de vencimento.
- O agente informa ao usuário que a tarefa foi criada e que ele pode definir a data manualmente nas
  configurações da tarefa.
- A interface de edição de tarefa permite ao usuário definir `due_date` com um date picker nativo.

**Esta regra só pode ser alterada via novo ADR** que documente a solução de parsing implementada
e os casos de teste que cobrem as ambiguidades identificadas acima.

---

## Consequências

### Positivas
- **UX simplificada no MVP:** Sem erros de data mal interpretada — o usuário sempre sabe o que vai acontecer.
- **Implementação trivial:** Sem bibliotecas adicionais de NLP ou chamadas extras à OpenAI.
- **Testes determinísticos:** `due_date` é sempre `null` — sem necessidade de mockar data/hora atual nos testes.
- **Zero bugs de timezone:** Sem cálculo de data, sem problema de timezone.

### Negativas / Trade-offs
- **Fricção para o usuário:** Usuário precisa abrir a tarefa e definir a data manualmente — dois passos em vez de um.
- **Expectativa vs realidade:** Usuários familiarizados com assistentes como Siri/Google Assistant podem esperar
  que a data seja extraída automaticamente.

### Neutras / Observações
- A tarefa criada via chat **deve** notificar ao usuário que `due_date` não foi definido, com call-to-action
  para editar a tarefa (ex.: "Tarefa criada! Você pode adicionar uma data de vencimento nas configurações.").
- No endpoint `/api/tasks/` (CRUD direto, não via chat), `due_date` é aceito normalmente.

---

## Alternativas Consideradas

### Alternativa A: Parsear data com `dateutil` + contexto de data atual injetado no prompt
- **Por que descartada:** Requer injetar data/hora atual e timezone do usuário no prompt, parsing no backend,
  e tratamento de múltiplos casos de ambiguidade. Escopo de MVP excedido.

### Alternativa B: Pedir confirmação ao usuário via chat antes de criar a tarefa
- **Por que descartada:** Adiciona uma rodada de interação (e uma chamada extra à OpenAI), tornando a UX
  mais lenta. O usuário prefere criar rápido e ajustar depois.

### Alternativa C: Extrair data mas marcar como `requires_confirmation = true`
- **Por que descartada:** Exige novo campo na tabela, novo estado no frontend e fluxo de confirmação —
  complexidade desproporcional ao ganho no MVP.
