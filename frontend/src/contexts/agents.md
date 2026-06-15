# agents.md — Contextos (`src/contexts/`)

> Contexto do estado global do Shello. Leia antes de modificar `ShelloContext.tsx` ou consumir dados em telas.

---

## Arquivo Existente

| Arquivo | Papel |
|---------|-------|
| `ShelloContext.tsx` | Estado global do app: usuário, dados (diário, tarefas, rotinas, memórias), preferências |

---

## O que o `ShelloContext` Gerencia

### Estado

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nomeUsuario` | `string` | Nome preferido do usuário (vem de `/api/users/preferences` ou do cadastro) |
| `onboardingConcluido` | `boolean` | Controla qual fluxo de navegação renderizar |
| `dadosOnboarding` | `DadosOnboarding \| null` | Nome, estilo de vida, meta do onboarding |
| `carregando` | `boolean` | `true` enquanto carrega dados do AsyncStorage/API no startup |
| `nivelFormalidade` | `NivelFormalidade` | `'baixa' \| 'media' \| 'alta'` — tom da IA |
| `entradas` | `EntradaDiario[]` | Todas as entradas do diário do usuário |
| `tarefas` | `Tarefa[]` | Todas as tarefas do usuário |
| `rotinas` | `Rotina[]` | Rotinas (manhã/tarde/noite) do usuário |
| `memorias` | `MemoriaIA[]` | Memórias que a IA tem sobre o usuário |

### Inicialização

No mount do `ShelloProvider`, o contexto:
1. Faz `api.get('/health')` silencioso (warm-up do servidor Railway).
2. Lê o usuário do `AsyncStorage`.
3. Dispara `Promise.allSettled` para `/api/diary`, `/api/tasks`, `/api/routines`, `/api/memories`, `/api/users/preferences` em paralelo.
4. Cada resultado é independente — falha de um não bloqueia os outros.
5. Define `carregando = false` após todas as promises resolverem/rejeitarem.

---

## Ações Disponíveis

### Diário

| Função | Assinatura | Endpoint |
|--------|-----------|----------|
| `adicionarEntrada` | `(titulo, conteudo) → Promise<EntradaDiario>` | `POST /api/diary` |
| `atualizarEntrada` | `(id, titulo, conteudo) → Promise<void>` | `PUT /api/diary/:id` |
| `marcarEntradaComoContexto` | `(id, conteudo) → Promise<void>` | `POST /api/memories` + `GET /api/memories` |

> `adicionarEntrada` usa **optimistic update**: insere item temporário imediatamente, substitui pelo real ao receber resposta da API, ou remove em caso de erro.

> `marcarEntradaComoContexto` tem lógica anti-duplicata: verifica se já existe memória com conteúdo similar antes de criar.

### Tarefas

| Função | Assinatura | Endpoint |
|--------|-----------|----------|
| `adicionarTarefa` | `(titulo, descricao?, data?) → Promise<Tarefa>` | `POST /api/tasks` |
| `alternarTarefa` | `(id) → Promise<void>` | `PATCH /api/tasks/:id` |

> `alternarTarefa` usa **toggle optimista**: inverte `concluida` localmente imediato; reverte se API falhar.

### Rotinas

| Função | Assinatura | Endpoint |
|--------|-----------|----------|
| `adicionarRotina` | `(titulo, atividades, periodo) → Promise<void>` | `POST /api/routines` |
| `removerRotina` | `(id) → Promise<void>` | `DELETE /api/routines/:id` |

### Memórias da IA

| Função | Assinatura | Endpoint |
|--------|-----------|----------|
| `adicionarMemoria` | `(conteudo, tipo) → Promise<void>` | `POST /api/memories` |
| `removerMemoria` | `(id) → Promise<void>` | `DELETE /api/memories/:id` |
| `recarregarMemorias` | `() → Promise<void>` | `GET /api/memories` |

### Onboarding & Sessão

| Função | Assinatura | Endpoint |
|--------|-----------|----------|
| `concluirOnboarding` | `(dados: DadosOnboarding) → Promise<void>` | `POST /api/onboarding/complete` |
| `sair` | `() → Promise<void>` | — (limpa AsyncStorage + estado) |

### Utilitários

| Função | Assinatura | O que faz |
|--------|-----------|-----------|
| `setNivelFormalidade` | `(nivel) → void` | Atualiza formalidade localmente |
| `recarregarDados` | `() → Promise<void>` | Re-fetch completo de todos os dados |
| `definirUsuario` | `(nome, onboardingOk) → void` | Usado pela `TelaAutenticacao` após login/register |

---

## Como Consumir o Contexto

### Hook padrão — `useShello()`

```tsx
import { useShello } from '../contexts/ShelloContext';

export default function MinhasTarefas() {
  const { tarefas, adicionarTarefa, alternarTarefa } = useShello();

  // usar tarefas, chamar adicionarTarefa, etc.
}
```

> `useShello()` lança `Error` se chamado fora de um `ShelloProvider`. Isso é intencional — falha rápido em desenvolvimento.

### Exemplo completo

```tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useShello } from '../contexts/ShelloContext';

export default function BotaoCriarTarefa() {
  const { adicionarTarefa } = useShello();
  const [loading, setLoading] = useState(false);

  async function criar() {
    setLoading(true);
    try {
      await adicionarTarefa('Minha nova tarefa', 'Descrição opcional', '2026-06-20');
    } catch {
      // exibir erro para o usuário
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity onPress={criar} disabled={loading}>
      <Text>{loading ? 'Criando...' : 'Criar Tarefa'}</Text>
    </TouchableOpacity>
  );
}
```

---

## Como Atualizar Estado Global

**Via as ações do contexto** (preferencial):
```ts
const { adicionarEntrada } = useShello();
await adicionarEntrada('', 'Conteúdo da nota');
```

**Via `recarregarDados`** (quando precisar sincronizar tudo com a API):
```ts
const { recarregarDados } = useShello();
await recarregarDados(); // re-fetch: diary + tasks + routines + memories + preferences
```

**Nunca** mutar arrays do contexto diretamente — os setters internos do provider são privados.

---

## Quando Usar Context vs Estado Local

| Situação | Usar |
|----------|------|
| Dados do usuário (nome, preferências) | `ShelloContext` |
| Listas compartilhadas (entradas, tarefas, rotinas, memórias) | `ShelloContext` |
| Estado de autenticação / onboarding | `ShelloContext` |
| Flag de loading de uma ação local | `useState` na tela |
| Texto de um input | `useState` na tela |
| Modal aberto/fechado | `useState` na tela |
| Dados de uma requisição específica da tela, sem compartilhamento | `useState` na tela |
| Animação local | `useRef` + `Animated` na tela |

---

## Mappers de API

O `ShelloContext` contém funções privadas que convertem shapes da API para os tipos TypeScript do app:

| Mapper | Converte |
|--------|---------|
| `mapDiaryEntry(d)` | Response da API `/api/diary` → `EntradaDiario` |
| `mapTask(t)` | Response da API `/api/tasks` → `Tarefa` |
| `mapRotina(r)` | Response da API `/api/routines` → `Rotina` |
| `mapMemoria(m)` | Response da API `/api/memories` → `MemoriaIA` |

> Nunca parsear o shape da API diretamente nas telas. Se um endpoint retornar um tipo novo, adicionar o mapper aqui e expor pelo contexto.

---

## Estrutura do Provider na Árvore

```tsx
// App.tsx
<SafeAreaProvider>
  <ShelloProvider>          ← Estado global disponível aqui
    <NavigationContainer>
      <Navigation />        ← Acessa useShello() para decidir o fluxo
    </NavigationContainer>
  </ShelloProvider>
</SafeAreaProvider>
```

O `ShelloProvider` deve sempre envolver o `NavigationContainer` (não o contrário) para que o navigator possa reagir a mudanças de estado de autenticação.
