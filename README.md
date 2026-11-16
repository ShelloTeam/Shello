# Shello

Assistente pessoal com diário, tarefas, rotinas e chat com o mascote Shello.
Aplicativo **Flutter** que roda **offline**: sem servidor, sem banco remoto e sem chave de API.

> A versão anterior (React Native + FastAPI + Supabase + OpenAI) não faz mais parte da
> árvore. Está preservada no commit `d970767`. Veja
> [`docs/migracao-flutter.md`](docs/migracao-flutter.md).

## Requisitos

- Flutter 3.50 (canal stable) e Dart 3.14
- Android SDK para gerar APK (Android Studio ou `flutter config --android-sdk`)
- Chrome, para rodar a versão web de verificação

## Comandos

| Comando | O que faz |
|---|---|
| `make setup` | Instala as dependências (`flutter pub get`) |
| `make run` | Roda no dispositivo ou emulador conectado |
| `make web` | Roda no Chrome, em viewport de celular |
| `make test` | Roda toda a suíte de testes |
| `make analyze` | Análise estática e verificação de formatação |
| `make apk` | Gera o APK de debug (`build/app/outputs/flutter-apk/`) |
| `make web-build` | Gera o build web de produção (`build/web/`) |

Equivalentes diretos: `flutter pub get`, `flutter run`, `flutter test`,
`flutter analyze`, `flutter build apk --debug`, `flutter build web --release`.

## Demonstração

Na primeira execução, o aplicativo grava os dados de demonstração no aparelho.

- **Conta de demonstração:** `demo@exemplo.com` / `Demo@1234` (usuária "Ana")
- **Cadastro:** cria uma conta local e leva ao onboarding (três etapas)
- **Restaurar a demonstração:** Perfil → "Restaurar demonstração" (aparece só na conta
  de demonstração). Regrava os dados de exemplo sem desconectar.

Os dados ficam no aparelho, separados por conta: cada conta tem seu diário, tarefas,
rotinas, memórias e preferências. Nenhuma ação depende de rede.

## Funcionalidades

- **Início:** sequência de dias com a faixa dos últimos sete dias, números de hoje e atalhos.
- **Diário:** entradas agrupadas por data, busca, filtros, edição e exclusão com confirmação.
  Uma entrada pode virar contexto do Shello ("+ Contexto Shello").
- **Shello (chat):** respostas determinísticas por intenção, em Markdown. Pedidos como
  "criar tarefa …" geram um card para confirmar. Limite de 20 mensagens por conversa,
  arquivamento após 2h de inatividade e histórico somente leitura.
- **Tarefas ("Sua Jornada"):** barra de progresso, pendentes, concluídas e atrasadas, com busca, filtros,
  seletor de data em pt-BR e edição. Rotinas por manhã, tarde e noite.
- **Perfil:** nome de referência, formalidade do Shello, tema claro ou escuro, memórias
  (criação e exclusão), conta e restauração da demonstração.

## Estrutura

```
lib/
  app/          raiz do app, tema, roteamento e casca de abas
  core/         domínio compartilhado, armazenamento, utilitários, seed e providers
  shared/       widgets e animações reutilizáveis
  features/     autenticacao, onboarding, preferencias, inicio, diario, chat,
                tarefas, perfil  (cada uma: domain/ data/ presentation/)
test/           testes de domínio, repositórios, controllers, integração e interface
assets/images/  logo e sprite de expressões do mascote
docs/           documentação (ver docs/README.md)
```

## Testes

```bash
flutter test
```

A suíte cobre regras de negócio, persistência, controllers, integração entre módulos e
fluxos de interface (autenticação, onboarding, diário, tarefas, chat, perfil e navegação).

## Capturas

As capturas em [`docs/screenshots/flutter/`](docs/screenshots/flutter/) vêm do build web
em Chromium, com viewport de celular. Não são de emulador Android. Veja as limitações no
relatório da migração.

## Documentação

- [`docs/README.md`](docs/README.md): índice com o status de cada documento
- [`agents.md`](agents.md): guia para agentes e desenvolvedores
- [`CLAUDE.md`](CLAUDE.md): regras de trabalho (TDD, camadas, validação)
