# agents.md — Telas (`src/screens/`)

> Contexto de cada tela existente no app Shello. Leia antes de modificar ou criar telas.

---

## Visão Geral

Cada arquivo `.tsx` neste diretório corresponde a uma tela do app. Telas **não** gerenciam lógica de negócio diretamente — elas consomem `useShello()` para estado global e `api` (axios) para chamadas pontuais.

**Regra:** dados que precisam ser compartilhados entre telas → `ShelloContext`. Dados locais de UI (loading, input, modais) → `useState` local na tela.

---

## Telas Existentes

### `HomeScreen.tsx`
**Tela inicial pós-login. Aba: `HomeTab`.**

- Exibe saudação personalizada com o nome do usuário (`nomeUsuario` do contexto).
- Mostra a data atual formatada em português (ex: "Domingo, 15 de junho").
- Calcula e exibe o **streak** de dias consecutivos com entrada no diário (lógica local, baseada em `entradas` do contexto).
- Cards de atalho rápido para: Chat, Diário, Tarefas.
- Badges de progresso (tarefas concluídas, entradas esta semana).
- **Não** possui input de texto — é uma tela de overview, sem interação de escrita direta.
- Navegação programática via `useNavigation<BottomTabNavigationProp<...>>()`.

**Endpoints:** nenhum direto. Consome estado de `useShello()` (`entradas`, `tarefas`, `nomeUsuario`).

---

### `TelaAutenticacao.tsx`
**Tela de login e cadastro. Stack: `Autenticacao` (antes do onboarding).**

- Alterna entre modo **Login** e **Cadastro** via tab interno.
- Modo Login: campos `email` + `senha` → `authService.login()`.
- Modo Cadastro: campos `nome` + `email` + `senha` + confirmação → `authService.register()`.
- Após sucesso: chama `context.definirUsuario(nome, false)` → navega para `Onboarding`.
- Após login de usuário já com onboarding: `definirUsuario(nome, true)` → vai direto para `Hub` (tabs).
- Exibe erros de autenticação inline abaixo dos campos.
- Mascote Shello visível no topo.

**Endpoints:**
- `POST /api/v1/auth/mobile/login`
- `POST /api/v1/auth/mobile/register`

> Essas chamadas são feitas via `authService.ts` (não via `api.ts` — não há token ainda).

---

### `TelaChat.tsx`
**Tela de conversa com a IA. Aba: `ChatTab` (botão central elevado).**

- Chat em tempo real com a IA Shello.
- Mascote expressivo com estados: `neutro | duvidoso | surpreso | feliz`.
- Renderiza respostas da IA em **Markdown** via `react-native-markdown-display`.
- Limite de **20 mensagens** por conversa (Regra 4.1) — exibe aviso ao atingir.
- **Card de sugestão de tarefa** (Regra 4.2): quando a IA detecta uma intenção de tarefa na resposta, exibe card com botão "Criar tarefa" → chama `adicionarTarefa()` do contexto.
- `KeyboardAvoidingView` + `FlatList` invertida para scroll de chat.
- Envia histórico das últimas mensagens para manter contexto da conversa.

**Endpoints:**
- `POST /api/chat` — payload: `{ message: string, history: MensagemChat[] }`

**Tipos relevantes:** `MensagemChat`, `ExpressaoShello` (em `src/types/index.ts`).

---

### `TelaDiario.tsx`
**Lista de entradas do diário. Stack: `ListaEntradas` dentro de `NavegacaoDiario`.**

- Exibe todas as entradas (`entradas` do contexto) em lista ordenada por data.
- Card de cada entrada: título truncado (40 chars) + data + badge "No contexto" se `adicionadaAoContexto == true`.
- Botão FAB (+) → navega para `EntradaDiario` com `{ nova: true }`.
- Toque em card → navega para `EntradaDiario` com `{ entrada: EntradaDiario }`.
- Botão "Adicionar ao contexto" no card → chama `marcarEntradaComoContexto()` (transforma entrada em memória da IA).

**Endpoints:** nenhum direto. Lista vem de `useShello().entradas`.

---

### `TelaEntradaDiario.tsx`
**Criar ou editar uma anotação do diário. Stack: `EntradaDiario` dentro de `NavegacaoDiario`.**

- Recebe parâmetros de rota: `{ entrada?: EntradaDiario; nova?: boolean }`.
- Modo criação (`nova: true`): campo de texto vazio → `adicionarEntrada()`.
- Modo edição (`entrada` preenchida): carrega conteúdo → `atualizarEntrada()`.
- Título é gerado automaticamente (primeiros 40 chars do conteúdo) — o usuário não digita título separado.
- Botão salvar com feedback visual de loading.
- Após salvar: `navigation.goBack()`.

**Endpoints (via ShelloContext):**
- `POST /api/diary` (criação)
- `PUT /api/diary/:id` (edição)

**Tipagem de rota:**
```ts
import { DiarioStackParamList } from '../navigation/NavegacaoDiario';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<DiarioStackParamList, 'EntradaDiario'>;
```

---

### `TelaTarefas.tsx`
**Lista e gestão de tarefas. Aba: `TarefasTab`.**

- Lista de tarefas separadas por status: pendentes / concluídas.
- Checkbox de cada item → `alternarTarefa(id)` (toggle optimista — reverte se API falhar).
- Modal/sheet de criação: campos `título`, `descrição` (opcional), `data` (opcional).
- Filtros por status e pesquisa por título.
- Suporte a tarefas sugeridas pelo Chat (chegam via `adicionarTarefa()` já chamado em `TelaChat`).

**Endpoints (via ShelloContext):**
- `GET /api/tasks` (carregamento inicial no provider)
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

---

### `TelaPerfil.tsx`
**Configurações do usuário e do agente Shello. Aba: `PerfilTab`.**

- Exibe nome do usuário, email.
- Configuração do nível de formalidade da IA: `baixa | media | alta` → `setNivelFormalidade()`.
- Gerenciamento de **memórias da IA** (`memorias` do contexto): lista, adiciona e remove memórias.
- Gerenciamento de **rotinas** (`rotinas` do contexto): lista, cria e exclui rotinas com atividades e período.
- Botão "Sair" → `sair()` do contexto.

**Endpoints (via ShelloContext):**
- `GET /api/memories`, `POST /api/memories`, `DELETE /api/memories/:id`
- `GET /api/routines`, `POST /api/routines`, `DELETE /api/routines/:id`
- `GET /api/users/preferences`

---

### `TelaOnboarding.tsx`
**Fluxo de configuração inicial pós-cadastro. Stack: `Onboarding`.**

- Apresentado apenas uma vez, logo após o primeiro cadastro.
- Coleta: `nome preferido`, `estilo de vida`, `meta atual`.
- Fluxo em etapas (slides/pages internas).
- Ao concluir: `concluirOnboarding(dados)` → POST `/api/onboarding/complete` → navega automaticamente para `Hub` (tabs).

**Endpoints (via ShelloContext):**
- `POST /api/onboarding/complete`

---

## Como Criar uma Nova Tela

### 1. Criar o arquivo de tela

```tsx
// src/screens/TelaNova.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';

export default function TelaNova() {
  const { nomeUsuario } = useShello();

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.conteudo}>
        <Text style={estilos.titulo}>Olá, {nomeUsuario}</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  conteudo: {
    flex: 1,
    padding: ShelloTema.espacamento.md,
  },
  titulo: {
    fontSize: ShelloTema.tipografia.tamanhos.grande,
    color: ShelloTema.cores.textoP,
    fontFamily: ShelloTema.tipografia.titulo,
  },
});
```

### 2. Adicionar à navegação

- **Nova aba** → editar `NavegacaoAbas.tsx`.
- **Tela dentro de stack existente** → editar o navigator correspondente (ex: `NavegacaoDiario.tsx`).
- **Nova stack** → criar `NavegacaoNova.tsx` e registrar em `NavegacaoAbas.tsx` ou `index.tsx`.

### 3. Tipar os parâmetros de rota

Se a tela recebe params:
```ts
export type MinhaStackParamList = {
  ListaPrincipal: undefined;
  TelaNova: { id: string; titulo?: string };
};
```

---

## Padrões de Componente

| Padrão | Regra |
|--------|-------|
| Wrapper externo | Sempre `<SafeAreaView>` com `backgroundColor` do tema |
| Cores e tamanhos | Sempre via `ShelloTema` — zero valores hardcoded |
| Estado global | `useShello()` — nunca prop-drill dados de usuário |
| Estado local de UI | `useState` dentro da tela (loading, modal aberto, texto do input) |
| Requisições ad-hoc | `api.get/post/...` direto na tela (para endpoints fora do contexto) |
| Feedback de loading | `ActivityIndicator` com `ShelloTema.cores.marca` como cor |
| Tratamento de erro | `try/catch` com mensagem inline — nunca silencioso em ação do usuário |
