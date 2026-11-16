# ADR-006 — Dados separados por conta no aparelho

## Status

`Accepted`

**Data:** 2026-11-15
**Autor(es):** Equipe Shello (migração conduzida com o agente Claude)

---

## Contexto

Na primeira versão Flutter, todos os dados do usuário (diário, memórias, tarefas,
rotinas, conversas e preferências) eram gravados em chaves globais do aparelho. Isso
produzia fluxos sem sentido:

- uma conta nova herdava o diário e as memórias da conta de demonstração;
- o nome e o onboarding gravados por uma conta sobrescreviam os da outra;
- restaurar a demonstração substituía os dados de qualquer conta em uso.

Na versão original, esses dados ficavam no servidor e eram isolados por usuário. Sem
servidor (ADR-005), o isolamento precisa acontecer localmente.

## Decisão

1. **Escopo por conta em um decorator.** `EscopoContaKeyValueStore` envolve o
   `KeyValueStore` físico. Chaves de conta são gravadas como `conta.<id>.<chave>`, onde
   `<id>` é o da sessão atual. Chaves globais (`shello.versao`, `shello.contas` e
   `shello.sessao`) passam direto. Sem sessão, gravar dados de conta lança `StateError`.
2. **Repositórios não conhecem o escopo.** Os repositórios de dados recebem o
   armazenamento por `armazenamentoDaContaProvider`, derivado do físico. A autenticação e
   a semeadura usam o armazenamento físico (`keyValueStoreProvider`).
3. **Os controllers de dados observam a sessão.** Cada controller de dados observa
   `sessaoProvider`. Entrar, cadastrar ou sair reconstrói o estado a partir da conta em
   uso. Não há invalidação manual espalhada após a troca de sessão.
4. **Cadastro não reinicia preferências globais.** A conta nova começa vazia, com o
   onboarding pendente e sem nome de referência.
5. **A demonstração pertence só à conta demo.** `garantirContaDemonstracao` devolve o id
   da conta, sem abrir sessão. `restaurarDemonstracao` regrava somente os dados dessa
   conta. O botão de restauração aparece apenas quando a sessão é a conta demo.
6. **Versão 2 do armazenamento.** Os dados gravados pela versão 1 não tinham dono
   identificável. Na atualização, `prepararArmazenamento` remove as chaves listadas em
   `ChavesArmazenamento.dadosDeConta` e recria a demonstração na conta demo.

### Alternativas consideradas

- **Prefixar as chaves em cada repositório.** Espalharia a regra por seis repositórios.
  Rejeitada.
- **Um arquivo ou banco por conta.** Mais complexo que o necessário para o escopo atual.
  O armazenamento chave-valor basta.
- **Invalidar os providers manualmente no login e no logout.** Funciona, mas depende de
  lembrar cada provider. Um teste mostrou o caso que a invalidação manual deixa passar:
  voltar à mesma conta sem que o estado em cache seja recarregado. Observar a sessão
  elimina essa classe de erro.

## Consequências

- Os dados continuam no aparelho. Não há sincronização entre dispositivos nem
  recuperação de conta.
- Senhas seguem como hash SHA-256 salgado, sem alteração.
- Um novo repositório de dados de conta deve usar `armazenamentoDaContaProvider` e
  incluir sua chave em `ChavesArmazenamento.dadosDeConta`. Caso contrário, o dado fica
  global.
- Mudanças de formato continuam exigindo incremento de `ChavesArmazenamento.versaoAtual`
  e documentação da migração, conforme `agents.md`.
- O isolamento é testado em `test/integracao/isolamento_contas_test.dart` e no teste do
  decorator em `test/core/storage/escopo_conta_key_value_store_test.dart`.
