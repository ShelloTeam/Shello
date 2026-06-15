# agents.md — Frontend Shello

> Contexto de alto nível do frontend mobile. Leia este arquivo antes de modificar qualquer coisa em `frontend/`.

---

## O que é este projeto

Aplicativo mobile **React Native + Expo SDK 54** escrito em TypeScript. É o cliente do Shello, um assistente pessoal de IA que conversa com o usuário, gerencia tarefas, diário e rotinas.

Ponto de entrada: `App.tsx` → `ShelloProvider` → `NavigationContainer` → `Navigation` (router).

---

## Estrutura de Diretórios

```
frontend/
├── App.tsx                  # Ponto de entrada: providers + NavigationContainer
├── app.json                 # Configuração Expo (name, slug, version)
├── eas.json                 # Build profiles (development, preview, production)
├── package.json             # Dependências e scripts
├── tsconfig.json            # TypeScript strict mode
├── .env                     # Variáveis de ambiente locais (não commitadas)
└── src/
    ├── screens/             # Telas do app (uma por arquivo)
    ├── navigation/          # Configuração de rotas (tabs + stacks)
    ├── contexts/            # Estado global (ShelloContext)
    ├── services/            # Cliente HTTP (api.ts) e authService.ts
    ├── styles/              # Design tokens (tema.ts)
    ├── types/               # Tipos TypeScript globais (index.ts)
    ├── hooks/               # Hooks customizados (diretório — expandir conforme necessário)
    ├── components/          # Componentes reutilizáveis
    └── utils/               # Funções utilitárias puras
```

---

## Como Rodar

### Expo Go (desenvolvimento rápido)
```bash
cd frontend
npx expo start
# Escanear QR com Expo Go (iOS/Android)
```

### Build Android debug
```bash
npx expo run:android
```

### Build de distribuição (EAS)
```bash
# APK interno (preview)
eas build --profile preview --platform android

# AAB produção
eas build --profile production --platform android
```

### Comandos do Makefile (raiz do monorepo)
```bash
make dev      # Inicia expo start no frontend
make apk      # Build EAS preview Android
make check    # TypeScript check (tsc --noEmit) + lint
```

### Scripts npm diretos
| Script | Comando | O que faz |
|--------|---------|-----------|
| `start` | `expo start` | Dev server Expo |
| `android` | `expo run:android` | Build + run Android |
| `ios` | `expo run:ios` | Build + run iOS |
| `ts-check` | `tsc --noEmit` | Verifica tipos sem compilar |
| `test` | `jest` | Roda a suíte de testes |
| `test:coverage` | `jest --coverage` | Relatório de cobertura |

---

## Variáveis de Ambiente

O Expo exige o prefixo `EXPO_PUBLIC_` para variáveis acessíveis no bundle client-side.

| Variável | Valor padrão (.env) | Onde é usada |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://shello-production.up.railway.app` | `src/services/api.ts` — `baseURL` do axios |
| `API_URL` | `https://shello-production.up.railway.app` | Alias legacy (não usar em código novo) |

**Para dev local contra backend local:**
```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000   # IP LAN da máquina (não localhost — device físico)
```

> Fallback hardcoded em `api.ts`: `http://localhost:8000` (funciona só em simulador).

---

## Fluxo de Navegação do Usuário

```
App start
  │
  ├─ carregando == true → Spinner (ActivityIndicator)
  │
  └─ carregando == false
        │
        ├─ onboardingConcluido == false
        │     ├─ TelaAutenticacao  (login / cadastro)
        │     └─ TelaOnboarding    (fluxo inicial pós-cadastro)
        │
        └─ onboardingConcluido == true
              └─ NavegacaoAbas (Bottom Tabs)
                    ├─ HomeTab     → HomeScreen
                    ├─ DiarioTab   → NavegacaoDiario (Stack)
                    │                   ├─ ListaEntradas → TelaDiario
                    │                   └─ EntradaDiario → TelaEntradaDiario
                    ├─ ChatTab     → TelaChat        ← botão central elevado
                    ├─ TarefasTab  → TelaTarefas
                    └─ PerfilTab   → TelaPerfil
```

---

## Endpoints Consumidos

A API completa está documentada em **`http://localhost:8000/docs`** (Swagger) ou na URL de produção `/docs`.

Resumo dos endpoints que o frontend consome diretamente:

| Método | Endpoint | Usado em |
|--------|----------|---------|
| `GET` | `/health` | App startup (warm-up dyno Railway) |
| `POST` | `/api/v1/auth/mobile/login` | `authService.login()` |
| `POST` | `/api/v1/auth/mobile/register` | `authService.register()` |
| `POST` | `/api/onboarding/complete` | `ShelloContext.concluirOnboarding()` |
| `GET` | `/api/users/preferences` | `ShelloContext` — carregamento inicial |
| `GET/POST` | `/api/diary` | Diário — lista e criação |
| `PUT` | `/api/diary/:id` | Edição de entrada do diário |
| `GET/POST` | `/api/tasks` | Tarefas — lista e criação |
| `PATCH` | `/api/tasks/:id` | Alternar status da tarefa |
| `GET/POST` | `/api/routines` | Rotinas — lista e criação |
| `DELETE` | `/api/routines/:id` | Remoção de rotina |
| `GET/POST` | `/api/memories` | Memórias da IA |
| `DELETE` | `/api/memories/:id` | Remoção de memória |
| `POST` | `/api/chat` | Enviar mensagem ao Shello (TelaChat) |

> Para detalhes de payload e response shape, consulte sempre o Swagger.

---

## Autenticação

- Token Bearer armazenado em `AsyncStorage` com chave `@shello:token`.
- O interceptor em `src/services/api.ts` injeta `Authorization: Bearer <token>` em toda requisição automaticamente.
- Dados do usuário ficam em AsyncStorage com chave `@shello:user` (shape: `{ user_id, nome }`).
- Para limpar a sessão: `authService.logout()` → remove ambas as chaves → `ShelloContext.sair()` zera o estado.

---

## Padrões TypeScript Obrigatórios

1. **Sem `any` explícito** em código novo. Se o shape da API for desconhecido, use `unknown` e faça type narrowing.
2. **Tipos globais** ficam em `src/types/index.ts`. Não criar interfaces duplicadas em arquivos de tela.
3. **Props de componentes** devem ter `interface` explícita acima do componente.
4. **Tipagem de navegação**: usar `BottomTabNavigationProp` / `NativeStackNavigationProp` com `ParamList` definido no navigator correspondente.
5. **Rodar `tsc --noEmit`** antes de qualquer PR (`npm run ts-check`).
6. **Mappers** de dados da API ficam em `ShelloContext.tsx` (funções `mapDiaryEntry`, `mapTask`, etc.) — não parsear shapes de API nas telas.

---

## Design System

Todos os valores visuais saem de `src/styles/tema.ts` (`ShelloTema`). Nunca hardcode cores, tamanhos de fonte ou espaçamentos nas telas — referencie os tokens:

```ts
import { ShelloTema } from '../styles/tema';

// Cores: ShelloTema.cores.marca, .fundo, .textoP, .textoS, .erro
// Tipografia: ShelloTema.tipografia.tamanhos.normal
// Espaçamento: ShelloTema.espacamento.md
// Forma (border radius): ShelloTema.forma.bordaMedia
// Sombra: ...ShelloTema.sombra.suave
```

---

## Dependências Principais

| Pacote | Versão | Papel |
|--------|--------|-------|
| `expo` | ~54.0.35 | SDK principal |
| `react-native` | 0.81.5 | Framework mobile |
| `@react-navigation/bottom-tabs` | ^7.2.0 | Navegação por abas |
| `@react-navigation/native-stack` | ^7.16.0 | Stack navigators |
| `axios` | ^1.7.2 | Cliente HTTP |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistência local (token, user) |
| `react-native-markdown-display` | ^7.0.2 | Renderizar respostas da IA em markdown |
