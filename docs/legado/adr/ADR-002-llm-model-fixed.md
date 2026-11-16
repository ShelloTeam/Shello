# ADR-002 — Modelo LLM Fixo: gpt-4o-mini-2024-07-18 com Temperatura 0.7

## Status

`Accepted`

**Data:** 2026-01-01
**Autor(es):** Time Shello

---

## Contexto

O Shello usa a API da OpenAI para geração de respostas conversacionais, extração de fragmentos de contexto
e detecção de modo de operação. As seguintes questões precisavam ser endereçadas:

1. **Custo imprevisível:** modelos mais avançados (gpt-4o, gpt-4-turbo) custam significativamente mais. Sem fixar
   o modelo, uma variável de ambiente mal configurada em produção poderia disparar o custo do projeto.

2. **Comportamento não-determinístico em testes:** se o modelo for configurável (via env var), os testes
   unitários precisariam mockar o valor da variável, e uma mudança de modelo poderia mudar o comportamento
   esperado sem alterar o código de teste — causando falsos positivos/negativos.

3. **Snapshot de modelo:** A OpenAI atualiza modelos sem snapshot (`gpt-4o-mini`) silenciosamente. Usar o
   snapshot com data (`gpt-4o-mini-2024-07-18`) garante comportamento consistente até que o snapshot seja
   deprecado.

---

## Decisão

O modelo e a temperatura do LLM são **hardcoded** no código de produção:

```python
# app/services/chat_service.py (ou similar)
LLM_MODEL = "gpt-4o-mini-2024-07-18"
LLM_TEMPERATURE = 0.7
```

**Proibições decorrentes desta decisão:**
- ❌ `LLM_MODEL` nunca será uma variável de ambiente.
- ❌ `LLM_TEMPERATURE` nunca será uma variável de ambiente.
- ❌ Nunca usar o alias sem snapshot (`gpt-4o-mini`) em produção.

**Troca de modelo só ocorre via:**
1. Novo ADR documentando a justificativa.
2. Pull Request alterando as constantes no código.
3. Deploy na `main`.

---

## Consequências

### Positivas
- **Custo previsível e monitorável:** O `CostTracker` pode calcular o custo exato sabendo que o modelo é fixo
  ($0.150/1M tokens input, $0.600/1M tokens output para `gpt-4o-mini-2024-07-18`).
- **Comportamento determinístico:** Testes podem assumir o comportamento exato do modelo mockado, sem surpresas
  de variações de modelo.
- **Auditabilidade:** Qualquer mudança de modelo é rastreável via Git (`git log`) — não pode ocorrer silenciosamente.
- **Temperatura 0.7:** Equilíbrio entre criatividade (não robótico) e consistência (não alucinante). Adequado
  para assistente pessoal.

### Negativas / Trade-offs
- **Troca de modelo exige deploy:** Não é possível mudar o modelo em produção sem um novo deploy. Em uma situação
  de emergência (ex.: snapshot deprecado), o processo é mais lento.
- **Sem experimentação dinâmica:** Não é possível testar diferentes modelos/temperaturas em produção sem alterar
  o código.

### Neutras / Observações
- Quando a OpenAI deprecar o snapshot `gpt-4o-mini-2024-07-18`, será necessário criar um novo ADR e atualizar
  as constantes. A OpenAI geralmente anuncia deprecações com vários meses de antecedência.

---

## Alternativas Consideradas

### Alternativa A: Modelo configurável via variável de ambiente `LLM_MODEL`
- **Por que descartada:** Risco de custo imprevisível, comportamento não-determinístico entre ambientes (dev vs prod)
  e dificuldade de rastrear mudanças. Uma env var mal configurada poderia usar `gpt-4o` em produção sem aviso.

### Alternativa B: Modelo configurável por usuário (premium tier)
- **Por que descartada:** Fora do escopo do MVP. Aumenta complexidade de billing e gerenciamento de features por usuário.
  Pode ser revisitado em um ADR futuro se o produto crescer.

### Alternativa C: Usar alias sem snapshot (`gpt-4o-mini`)
- **Por que descartada:** A OpenAI pode atualizar o modelo por trás do alias silenciosamente, mudando o comportamento
  do assistente sem nenhuma mudança no código. Snapshot com data garante estabilidade.
