# Git Workflow — Shello

> Convenções de Git para o projeto Shello. Seguir estas regras garante histórico legível,
> deploys previsíveis e rastreabilidade de mudanças.

---

## Conventional Commits

Todo commit deve seguir o formato:

```
<tipo>(<escopo opcional>): <descrição curta no imperativo>

[corpo opcional]

[rodapé opcional — ex.: BREAKING CHANGE, closes #123]
```

### Tipos válidos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade para o usuário |
| `fix` | Correção de bug |
| `chore` | Tarefas de manutenção (deps, configs, scripts) |
| `docs` | Alterações apenas em documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou correção de testes |
| `perf` | Melhoria de performance |
| `ci` | Mudanças em configuração de CI/CD |

### Exemplos de mensagens corretas

```bash
# Nova funcionalidade
feat(chat): adiciona detecção do modo PRATICO via keywords

# Correção de bug
fix(diary): rejeita corretamente conteúdo com apenas espaços em branco

# Tarefa de manutenção
chore(deps): atualiza fastapi para 0.111.0

# Documentação
docs(adr): adiciona ADR-004 sobre due_date nulo via chat

# Refatoração
refactor(services): extrai lógica de truncamento para função utilitária

# Testes
test(diary): adiciona casos de borda para validação de 10k chars

# Mudança com breaking change
feat(auth)!: muda autenticação de header para cookie HTTPOnly

BREAKING CHANGE: clientes precisam atualizar para enviar cookie em vez de header Authorization
```

### Exemplos de mensagens incorretas (evitar)

```bash
# Muito vago
fix: corrigindo bug

# Sem tipo
adiciona endpoint de tarefas

# Imperativo quebrado (use imperativo, não passado)
feat: adicionou suporte a fragmentos

# Maiúscula desnecessária no início da descrição
feat: Adiciona chat
```

---

## Branching Strategy

### Estrutura de branches

```
main                    ← branch de produção (deploy automático no Railway)
│
├── feature/nome-curto  ← nova funcionalidade
├── fix/nome-do-bug     ← correção de bug
└── chore/nome-tarefa   ← manutenção, refatoração, docs
```

### Regras

1. **Nunca** commitar diretamente na `main`.
2. Todo trabalho acontece em branches com prefixo `feature/`, `fix/` ou `chore/`.
3. Branches são criadas a partir da `main` atualizada.
4. Merges para `main` acontecem via **Pull Request (PR)**.
5. A branch deve ser deletada após o merge.

### Ciclo de vida de uma branch

```bash
# 1. Atualizar main local
git checkout main
git pull origin main

# 2. Criar branch de trabalho
git checkout -b feature/chat-modo-pratico

# 3. Desenvolver (commits incrementais e descritivos)
git add .
git commit -m "feat(chat): detecta keywords do modo PRATICO"
git commit -m "test(chat): adiciona testes unitários para detecção de modo"

# 4. Push e abertura de PR
git push origin feature/chat-modo-pratico
# Abrir PR no GitHub para revisão

# 5. Após merge, deletar branch
git branch -d feature/chat-modo-pratico
git push origin --delete feature/chat-modo-pratico
```

---

## Variáveis de Ambiente e Secrets

> ⚠️ **CRÍTICO:** O arquivo `.env` **nunca** deve ser commitado.

- `.env` e `.env.local` estão no `.gitignore` — verifique antes de commitar.
- Sempre use `.env.example` (sem valores reais) para documentar as variáveis necessárias.
- Secrets de produção são configurados **exclusivamente** nas Railway Variables.

```bash
# Verificação rápida antes de um push
git diff --cached --name-only | grep -E "\.env"
# Se retornar algo, NÃO faça push.
```

---

## Deploy Automático (Railway)

- Qualquer push para a branch `main` aciona o deploy automático no Railway.
- **Não há staging automático** — valide localmente antes de mergear.
- Se um deploy quebrar produção, reverter com:

```bash
git revert HEAD --no-edit
git push origin main
```

---

## Checklist de Pull Request

Antes de abrir um PR, confirme:

- [ ] Todos os testes passam (`pytest backend/tests/`)
- [ ] Nenhum arquivo `.env` no diff (`git diff --name-only origin/main`)
- [ ] Commits seguem Conventional Commits
- [ ] Documentação atualizada se comportamento foi alterado
- [ ] Sem `print()` ou `console.log()` de debug no código
