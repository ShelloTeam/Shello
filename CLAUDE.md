# CLAUDE.md — Shello (Flutter)

Instruções para o agente de código neste repositório. Leia também [`agents.md`](agents.md).

## Projeto

Aplicativo Flutter 3.50 offline e mockado: diário, tarefas, rotinas, chat determinístico
e perfil. Sem backend, sem rede, sem chave de API. A versão React Native e o backend
FastAPI foram removidos (commit `d970767`).

## Metodologia obrigatória: TDD (Red → Green → Refactor)

Para cada comportamento novo ou corrigido:

1. **RED**: escreva o teste primeiro e rode-o. Confirme que **falha pelo motivo esperado**
   (funcionalidade ausente ou resultado errado, não erro de digitação).
2. **GREEN**: escreva o mínimo de código para o teste passar.
3. **REFACTOR**: elimine duplicação e melhore nomes, mantendo a suíte verde.

Regras:

- Nunca escreva código de produção antes de ter um teste falhando.
- Um teste que nunca falhou não prova nada.
- Teste de domínio: sem widget, sem armazenamento real. Use `MemoriaKeyValueStore`.
- Teste de interface: use `test/helpers/app_de_teste.dart` (`subirApp`, `armazenamentoComSessao`).
- Antes de dizer que algo está pronto, rode `flutter analyze`, `dart format --set-exit-if-changed lib test`
  e `flutter test`, e informe o resultado.

## Arquitetura em camadas

```
lib/features/<funcionalidade>/
  domain/        regras puras (sem Flutter, sem armazenamento)
  data/          repositórios sobre KeyValueStore
  presentation/  telas, widgets, controllers (Notifier) e providers
```

- **Tela**: só monta a interface e chama o controller. Sem regra de negócio.
- **Controller** (`Notifier`): guarda o estado e chama repositórios. Invalida dependentes
  quando uma mutação afeta outra funcionalidade (ex.: excluir entrada invalida memórias).
- **Repositório**: lê e grava via `ColecaoJson` ou `KeyValueStore`. Sem regra de negócio.
- **Domínio**: regras, validações e cálculos. Sem dependência de Flutter.
- Dependências entram por `Provider` (Riverpod), e nunca por instanciação dentro da tela.

## Regras de negócio que não podem ser quebradas

| Regra | Onde |
|---|---|
| Uma conversa aceita no máximo 20 mensagens. A troca pergunta+resposta é atômica | `RegrasConversa`, `ChatRepository.adicionarMensagens` |
| Conversa inativa há mais de 2h é arquivada. Arquivada não recebe mensagens | `RegrasConversa.deveArquivar`, `ChatRepository.conversaAtiva` |
| Tarefa criada pelo chat **nunca** recebe data (regra D06) | `criarTarefasDoChat` |
| Máximo de 3 tarefas por confirmação do chat | `criarTarefasDoChat` |
| Anotação vazia é recusada. Máximo de 10.000 caracteres | `validarConteudoDiario` |
| Nome de referência tem no máximo 30 caracteres | `PreferenciasRepository.definirNomeReferencia` |
| Sugestão de tarefa do chat só cria tarefa após confirmação explícita | `ChatController.confirmarSugestao` |

## Identidade visual

- Cores, espaços, raios, sombras e tipografia vêm **só** de `lib/app/theme/shello_tokens.dart`.
  Não escreva valores visuais soltos nas telas (exceto as cores semânticas de categoria de
  memória, centralizadas em `cartao_memoria.dart`).
- Títulos usam a família `serif`. Corpo usa a fonte padrão.
- Mantenha os textos da versão original quando não houver motivo para mudar.

## Restrições do ambiente de desenvolvimento

- Não há emulador Android (sem KVM) nem Android SDK neste ambiente. Verificação visual é
  feita com `flutter build web` e capturas no Chromium (ver `docs/migracao-flutter.md`).
- Não crie capturas artificiais. Capturas precisam vir de uma execução real.

## Git

- Conventional Commits. Mensagens em português ou inglês, mas consistentes dentro do commit.
- Não crie pull request sem pedido explícito.
- Não faça push para `main`.
