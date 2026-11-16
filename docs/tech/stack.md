# Stack técnica — Shello (Flutter)

> Stack vigente desde a migração de 2026-11 (ver `docs/adr/ADR-005-migracao-flutter-offline.md`).
> A stack anterior (React Native, FastAPI, Supabase, OpenAI) está em
> `docs/legado/standards/stack-react-native-fastapi.md`.

## Ferramentas

| Item | Versão / detalhe |
|---|---|
| Flutter | 3.50.0 (canal stable) |
| Dart | 3.14 |
| Plataforma principal | Android (APK de debug) |
| Plataforma de verificação visual | Web (Chromium), viewport de celular |

## Dependências

| Pacote | Papel |
|---|---|
| `flutter_riverpod` | Estado e injeção de dependência (`Notifier`, `Provider`) |
| `go_router` | Navegação declarativa, com `StatefulShellRoute` para as abas |
| `shared_preferences` | Armazenamento chave-valor local persistente |
| `intl` | Datas e formatos em português do Brasil |
| `flutter_localizations` | Localização pt-BR (inclui o seletor de data) |
| `crypto` | Hash SHA-256 da senha simulada |
| `flutter_markdown_plus` | Renderização das respostas do chat em Markdown |
| `material_ui` / `cupertino_ui` | Pacotes indicados pelo Flutter 3.50 para os delegates de localização |

Não há dependência de rede, de servidor, de banco remoto ou de chave de API.

## Organização do código

```
lib/
  app/        raiz do app, tema (tokens e ThemeData), roteamento e casca de abas
  core/       domínio compartilhado, armazenamento, utilitários, seed e providers
  shared/     widgets e animações reutilizáveis
  features/   <funcionalidade>/domain | data | presentation
```

- `domain/`: regras puras (sem Flutter, sem armazenamento). Testadas diretamente.
- `data/`: repositórios sobre `KeyValueStore`. Testados com armazenamento em memória.
- `presentation/`: telas, controllers (Riverpod) e widgets. Testados com `testWidgets`.

## Qualidade

- `flutter analyze` sem issues.
- `dart format` aplicado a todo o projeto.
- `flutter test` com a suíte completa (domínio, repositórios, controllers, integração
  entre módulos e fluxos de interface).
