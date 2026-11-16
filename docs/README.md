# Documentação do Shello

Índice dos documentos do repositório, com o status de cada um.

## Vigente (usar como referência)

| Documento | Conteúdo |
|---|---|
| [`migracao-flutter.md`](migracao-flutter.md) | Relatório da migração: mapeamento de telas, decisões, desvios e validação |
| [`tech/stack.md`](tech/stack.md) | Stack técnica atual (Flutter, dependências, organização do código) |
| [`product/business-rules.md`](product/business-rules.md) | Regras de negócio do produto (chat, diário, tarefas, preferências) |
| [`product/glossary.md`](product/glossary.md) | Glossário de termos do domínio |
| [`standards/git-workflow.md`](standards/git-workflow.md) | Convenções de commit (Conventional Commits) e de branches |
| [`adr/ADR-003-tdd-mandatory.md`](adr/ADR-003-tdd-mandatory.md) | TDD obrigatório (ciclo Red → Green → Refactor) |
| [`adr/ADR-004-due-date-null-via-chat.md`](adr/ADR-004-due-date-null-via-chat.md) | Regra D06: tarefas do chat nunca recebem data |
| [`adr/ADR-005-migracao-flutter-offline.md`](adr/ADR-005-migracao-flutter-offline.md) | Decisão de migrar para Flutter, offline e mockado |
| [`adr/ADR-006-dados-por-conta.md`](adr/ADR-006-dados-por-conta.md) | Dados separados por conta no aparelho |
| [`adr/template.md`](adr/template.md) | Modelo para novos ADRs |
| [`screenshots/flutter/`](screenshots/flutter/) | Capturas do aplicativo (build web, ver observações no relatório) |

## Legado (histórico, não descreve a versão atual)

Estes documentos descrevem a versão React Native com backend FastAPI. Ficam para
consulta do histórico do produto. A versão anterior completa está no commit
`d970767`.

| Documento | Conteúdo |
|---|---|
| [`legado/adr/ADR-001-fastapi-supabase.md`](legado/adr/ADR-001-fastapi-supabase.md) | Escolha de FastAPI e Supabase (superada pelo ADR-005) |
| [`legado/adr/ADR-002-llm-model-fixed.md`](legado/adr/ADR-002-llm-model-fixed.md) | Modelo de LLM fixo (superada pelo ADR-005) |
| [`legado/standards/architecture.md`](legado/standards/architecture.md) | Arquitetura em camadas do backend |
| [`legado/standards/testing.md`](legado/standards/testing.md) | Testes do backend com pytest |
| [`legado/standards/stack-react-native-fastapi.md`](legado/standards/stack-react-native-fastapi.md) | Stack da versão anterior |
| [`legado/superpowers/specs/2026-06-16-password-reset-design.md`](legado/superpowers/specs/2026-06-16-password-reset-design.md) | Desenho da recuperação de senha por e-mail (não existe na versão Flutter) |
| [`legado/backlog-consolidated.md`](legado/backlog-consolidated.md), [`legado/backlog-investigation.md`](legado/backlog-investigation.md), [`legado/sprint-candidates.md`](legado/sprint-candidates.md), [`legado/task-evolution-plan.md`](legado/task-evolution-plan.md) | Backlog e planejamento da fase anterior |
