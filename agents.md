# agents.md — Guia do agente | Shello (Flutter)

> Leia este arquivo antes de alterar qualquer coisa. Ele aponta onde estão as informações
> e como executar tarefas. As regras de trabalho estão em [`CLAUDE.md`](CLAUDE.md).

## O que é o projeto

Shello é um assistente pessoal (diário, tarefas, rotinas e chat com o mascote) em
**Flutter 3.50 / Dart 3.14**. Roda **offline**, com dados locais e respostas determinísticas.
Não há servidor, banco remoto, LLM nem chave de API.

## Onde encontrar cada coisa

| Precisa de | Onde está |
|---|---|
| Regras de negócio | `docs/product/business-rules.md` |
| Glossário de termos | `docs/product/glossary.md` |
| Stack e organização | `docs/tech/stack.md` |
| Decisões de arquitetura | `docs/adr/` (ADR-005 descreve a migração) |
| Relatório da migração e desvios | `docs/migracao-flutter.md` |
| Convenções de Git | `docs/standards/git-workflow.md` |
| Documentação histórica (React Native / FastAPI) | `docs/legado/` |
| Tokens visuais (cores, espaços, raios, tipografia) | `lib/app/theme/shello_tokens.dart` |
| Seed e dados de demonstração | `lib/core/mocks/dados_demonstracao.dart` |
| Chaves de armazenamento | `lib/core/storage/chaves_armazenamento.dart` |
| Isolamento de dados por conta (ADR-006) | `lib/core/storage/escopo_conta_key_value_store.dart` e `armazenamentoDaContaProvider` em `lib/core/providers.dart` |
| Providers (injeção de dependência) | `lib/core/providers.dart` e `lib/features/*/presentation/*_providers.dart` |
| Rotas | `lib/app/router/rotas.dart` e `lib/app/router/app_router.dart` |

## Estrutura de uma funcionalidade

Cada pasta em `lib/features/` segue o mesmo padrão:

```
<funcionalidade>/
  domain/        regras puras: modelos, validações, cálculos (sem Flutter nem armazenamento)
  data/          repositórios sobre KeyValueStore (ColecaoJson para listas)
  presentation/  telas, controllers (Notifier do Riverpod), widgets e providers
```

- **Domínio** não importa Flutter nem armazenamento. Testes em `test/features/<f>/domain/`.
- **Repositórios** persistem via `KeyValueStore`. Testes em `test/features/<f>/data/` com
  `MemoriaKeyValueStore`.
- **Controllers** guardam o estado e chamam os repositórios. Testes de integração em
  `test/integracao/` e de interface em `test/features/<f>/presentation/`.

## Como executar tarefas comuns

### Acrescentar uma regra de negócio
1. Escreva o teste em `test/features/<f>/domain/` e confirme que falha.
2. Implemente a regra em `lib/features/<f>/domain/` até o teste passar.
3. Se a regra aparece na tela, escreva também o teste de interface antes da alteração.

### Acrescentar uma tela
1. Escreva o teste de interface em `test/features/<f>/presentation/` (ou em `test/app/`
   para fluxos que atravessam telas) e confirme que falha.
2. Crie a tela em `lib/features/<f>/presentation/`. Use `ShelloCard`, `ShelloBotaoPrincipal`,
   `ShelloCampo` e os demais componentes de `lib/shared/widgets/`.
3. Registre a rota em `lib/app/router/app_router.dart` e o caminho em `rotas.dart`.
4. Adicione a chave `Key('...')` nos elementos que os testes precisam encontrar.

### Mudar um modelo persistido
1. Atualize o `toJson`/`fromJson` do modelo e os testes de persistência.
2. Se o formato antigo deixar de ser lido, incremente `ChavesArmazenamento.versaoAtual`
   e documente a migração.

### Mudar dados de demonstração
Edite `DadosDemonstracao.criar` em `lib/core/mocks/dados_demonstracao.dart`. A seed é gravada
somente na conta demo (`restaurarDemonstracao`). Atualize
`test/core/mocks/dados_demonstracao_test.dart` e os testes de interface que dependem dos
números (sequência de dias, contagem de entradas, tarefas, memórias).

## Comandos

```bash
flutter pub get
flutter analyze
dart format lib test
flutter test
flutter run            # dispositivo ou emulador
flutter run -d chrome  # versão web
flutter build web --release --no-web-resources-cdn
flutter build apk --debug
```

## Regras inegociáveis

1. **TDD**: nenhum código de produção sem um teste que falhou antes.
2. **Camadas**: regra de negócio no domínio; nada de regra dentro de widget.
3. **Offline**: nenhuma funcionalidade pode depender de rede, servidor ou chave de API.
4. **Regras de negócio**: limite de 20 mensagens, arquivamento após 2h, regra D06 (tarefa
   do chat sem data, máximo de 3 por confirmação) e limite de 10.000 caracteres no diário.
5. **Respostas do chat** nunca são apresentadas como geradas por IA real.
6. **Commits** em Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
7. **Não faça push** para `main`. Trabalhe na branch de migração.
