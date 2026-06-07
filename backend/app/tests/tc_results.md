# Test Cases Results (Shello Backend)

## 1. Auth & Cadastro
- [ ] `TC-AUTH-001`: Cadastro válido (email, senha, nome) -> 303 Redirect to /onboarding, Cookie HttpOnly set
- [ ] `TC-AUTH-002`: Cadastro com e-mail duplicado -> 400 Bad Request (mensagema genérica)
- [ ] `TC-AUTH-003`: Login válido -> 303 Redirect to /dashboard, Cookie HttpOnly set
- [ ] `TC-AUTH-004`: Login inválido -> 401 Unauthorized
- [ ] `TC-AUTH-005`: Logout -> 200 OK, Cookie cleared

## 2. Onboarding
- [ ] `TC-ONB-001`: Completar onboarding -> 201, salva fragmentos iniciais, nome_referencia e onboarding_done=True
- [ ] `TC-ONB-002`: Tentar rota protegida sem onboarding_done -> 403 Forbidden

## 3. Tarefas
- [ ] `TC-TSK-001`: Criar tarefa válida -> 201 Created
- [ ] `TC-TSK-002`: Listar tarefas pendentes -> 200 OK, exibe `is_overdue` calculado
- [ ] `TC-TSK-003`: Toggle status -> 200 OK, alterna para 'done'
- [ ] `TC-TSK-004`: Operação em tarefa inexistente/de outro usuário -> 403 Forbidden

## 4. Fragmentos de Contexto
- [ ] `TC-CTX-001`: Criar fragmento (preferencia/fato/objetivo/restricao) -> 201 Created
- [ ] `TC-CTX-002`: Exceder limite de 20 ativos -> 422 Unprocessable Entity
