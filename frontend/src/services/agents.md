# agents.md — Serviços HTTP (`src/services/`)

> Contexto do cliente HTTP e serviços de autenticação. Leia antes de modificar chamadas de API.

---

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `api.ts` | Instância axios configurada com `baseURL` e interceptor de autenticação |
| `authService.ts` | Funções de login, cadastro, logout e leitura de token/user do AsyncStorage |
| `mockServicos.ts` | Dados mock para desenvolvimento/testes offline (não usar em produção) |

---

## `api.ts` — Cliente HTTP Principal

```ts
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@shello:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**O que acontece em cada requisição:**
1. `axios.create` define a `baseURL` a partir da env `EXPO_PUBLIC_API_URL`.
2. O interceptor lê o token do `AsyncStorage` (`@shello:token`).
3. Se existir, injeta `Authorization: Bearer <token>` no header.
4. A requisição segue normalmente.

> **Nota:** A leitura de `AsyncStorage` é async — o interceptor é `async/await`, o que significa que cada requisição espera a leitura do storage. Isso é intencional e correto.

---

## Variável `EXPO_PUBLIC_API_URL`

- Definida em `.env` na raiz de `frontend/`.
- O Expo expõe variáveis com prefixo `EXPO_PUBLIC_` no bundle client-side via `process.env`.
- **Fallback:** `http://localhost:8000` (funciona em simulador; em device físico use o IP LAN).
- Para ambiente de produção: `https://shello-production.up.railway.app`.

```bash
# .env para dev local
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

---

## `authService.ts` — Autenticação

Funções exportadas:

| Função | Assinatura | O que faz |
|--------|-----------|-----------|
| `login` | `(email, senha) → Promise<AuthUser>` | POST `/api/v1/auth/mobile/login` → salva token e user no AsyncStorage |
| `register` | `(nome, email, senha) → Promise<AuthUser>` | POST `/api/v1/auth/mobile/register` → salva token e user |
| `logout` | `() → Promise<void>` | Remove `@shello:token` e `@shello:user` do AsyncStorage |
| `getStoredUser` | `() → Promise<AuthUser \| null>` | Lê `@shello:user` do AsyncStorage |
| `getToken` | `() → Promise<string \| null>` | Lê `@shello:token` do AsyncStorage |

**Chaves do AsyncStorage:**
```ts
const TOKEN_KEY = '@shello:token';
const USER_KEY  = '@shello:user';  // JSON de AuthUser { user_id, nome }
```

**Interface `AuthUser`:**
```ts
export interface AuthUser {
  user_id: string;
  nome: string;
}
```

> **Por que `authService` não usa `api.ts`?** Porque no momento do login/registro não há token ainda — usar o interceptor seria seguro (ele só injeta se o token existir), mas o serviço foi mantido isolado para clareza e para evitar dependência circular.

---

## Como Adicionar uma Nova Chamada à API

### Opção A — Direto na tela (chamadas pontuais)

Use quando a chamada é específica de uma tela e o resultado não precisa ser compartilhado:

```tsx
import api from '../services/api';

// Dentro do componente
const [loading, setLoading] = useState(false);

async function buscarDados() {
  setLoading(true);
  try {
    const { data } = await api.get('/api/alguma-coisa');
    // usar data
  } catch (err) {
    // tratar erro
  } finally {
    setLoading(false);
  }
}
```

### Opção B — Via ShelloContext (estado compartilhado)

Use quando o resultado precisa estar disponível em múltiplas telas. Adicionar a função no `ShelloContext.tsx`:

```ts
// 1. Declarar na interface ShelloContextData
novaAcao: (param: string) => Promise<void>;

// 2. Implementar com useCallback no provider
const novaAcao = useCallback(async (param: string) => {
  const { data } = await api.post('/api/recurso', { param });
  // atualizar estado local do context
}, []);

// 3. Incluir no objeto `valor`
const valor: ShelloContextData = {
  ...,
  novaAcao,
};
```

### Opção C — Novo service file

Use quando a lógica é complexa ou envolve múltiplas chamadas relacionadas:

```ts
// src/services/tarefaService.ts
import api from './api';
import { Tarefa } from '../types';

export async function buscarTarefasPorData(data: string): Promise<Tarefa[]> {
  const { data: res } = await api.get('/api/tasks', { params: { date: data } });
  return res;
}
```

---

## Tratamento de Erros

### Padrão para erros de API em telas

```ts
import axios from 'axios';

try {
  const { data } = await api.post('/api/algo', payload);
} catch (err) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const mensagem = err.response?.data?.detail ?? 'Erro desconhecido';

    if (status === 401) {
      // Token inválido/expirado → redirecionar para login
    } else if (status === 422) {
      // Erro de validação do backend (FastAPI)
      console.error('Payload inválido:', err.response?.data);
    } else {
      // Erro genérico — mostrar para o usuário
    }
  }
}
```

### Erros silenciosos vs. visíveis

| Cenário | Tratamento |
|---------|-----------|
| Warm-up do servidor (startup) | Silencioso — `api.get('/health').catch(() => {})` |
| Ação iniciada pelo usuário | Sempre exibir feedback (mensagem de erro inline) |
| Carregamento inicial de dados | `Promise.allSettled` — falhar um endpoint não bloqueia os outros |
| Toggle de tarefa (optimistic) | Reverter estado local se API falhar |

---

## Fluxo de Autenticação Completo

```
1. TelaAutenticacao → authService.login(email, senha)
2.   → POST /api/v1/auth/mobile/login
3.   ← { token, user_id, nome }
4. authService salva token em AsyncStorage[@shello:token]
5. authService salva user em AsyncStorage[@shello:user]
6. TelaAutenticacao → context.definirUsuario(nome, onboardingOk)

Próximas requisições:
7. api.ts interceptor → AsyncStorage.getItem('@shello:token')
8.   → adiciona Authorization: Bearer <token> em cada request

Logout:
9. context.sair() → authService.logout()
10.  → AsyncStorage.multiRemove(['@shello:token', '@shello:user'])
11. context zera todo o estado em memória
```
