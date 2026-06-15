# ADR-003 — TDD Obrigatório como Processo de Desenvolvimento

## Status

`Accepted`

**Data:** 2026-01-01
**Autor(es):** Time Shello

---

## Contexto

O Shello possui regras de negócio críticas que, se implementadas incorretamente, têm consequências sérias:

- **Segurança:** RLS e validação de ownership (anotação de outro usuário deve retornar 403, não os dados).
- **Custo:** Uso inadvertido de um modelo errado ou temperatura incorreta pode gerar custo inesperado.
- **Moderação:** Respostas bloqueadas não devem ser salvas — um bug aqui persiste conteúdo indevido no banco.
- **Extração assíncrona:** `await` direto em vez de `asyncio.create_task()` bloqueia o event loop e degrada performance.

Além disso, o projeto é desenvolvido por uma equipe pequena onde cada desenvolvedor tem grande autonomia.
Sem uma rede de segurança de testes, refatorações e novas features podem quebrar comportamentos existentes
sem detecção imediata.

---

## Decisão

Adotamos **TDD (Test-Driven Development) estrito** com o ciclo obrigatório **Red → Green → Refactor**:

1. **Red:** Escrever o teste que descreve o comportamento desejado. O teste **deve falhar** antes de qualquer
   código de produção ser escrito.
2. **Green:** Escrever o **mínimo** de código de produção para o teste passar.
3. **Refactor:** Melhorar o código (legibilidade, performance, design) sem quebrar o teste.

**Regras decorrentes:**
- ❌ Proibido escrever código de produção sem um teste falhando escrito antes.
- ❌ Proibido fazer commit de código de produção sem cobertura mínima (ver [testing.md](../standards/testing.md)).
- ✅ Todo service tem no mínimo 3 testes unitários.
- ✅ Todo controller/router tem no mínimo 1 teste de integração por endpoint.
- ✅ Supabase e OpenAI são **sempre mockados** em testes — sem chamadas reais em testes.

---

## Consequências

### Positivas
- **Confiança no refactor:** A suíte de testes permite refatorar com segurança — se os testes passam, o comportamento
  está correto.
- **Documentação executável:** Os testes documentam o comportamento esperado de cada componente de forma precisa
  e verificável.
- **Detecção precoce de bugs:** Bugs são detectados durante o desenvolvimento, não em produção.
- **Design melhor:** TDD força a pensar na interface antes da implementação, resultando em código mais desacoplado
  e testável.
- **Segurança verificável:** Regras de segurança (403, RLS, moderação) são testadas explicitamente.

### Negativas / Trade-offs
- **Velocidade inicial menor:** Escrever testes antes do código leva mais tempo no curto prazo.
- **Curva de aprendizado:** Desenvolvedores não familiarizados com TDD precisam de tempo de adaptação.
- **Testes frágeis se mal escritos:** Testes acoplados à implementação (não ao comportamento) quebram a cada refatoração.
  Mitigação: testar comportamento, não implementação.

### Neutras / Observações
- Testes de integração de controller usam `httpx.AsyncClient` com `ASGITransport` — sem servidor real,
  sem porta de rede, sem setup complexo.
- A velocidade perdida no início é recuperada na fase de manutenção, quando o custo de bugs em produção é alto.

---

## Alternativas Consideradas

### Alternativa A: Testes escritos após implementação (Test-After Development)
- **Por que descartada:** Em equipes pequenas com autonomia alta, testes escritos depois tendem a ser superficiais,
  cobrindo apenas o caminho feliz. Regras críticas (403, moderação, extração async) ficam sem cobertura.

### Alternativa B: Testes apenas para funcionalidades críticas (seletivo)
- **Por que descartada:** Difícil definir objetivamente o que é "crítico" em tempo real. O critério subjetivo leva
  à subcobertura progressiva. TDD universal elimina essa decisão.

### Alternativa C: BDD com Behave/Gherkin
- **Por que descartada:** Overhead de sintaxe Gherkin sem benefício claro para um projeto sem stakeholders não-técnicos
  lendo os testes. pytest com nomes de função descritivos atende o mesmo objetivo com menos fricção.
