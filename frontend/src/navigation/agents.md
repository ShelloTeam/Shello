# agents.md — Navegação (`src/navigation/`)

> Contexto completo da estrutura de navegação do Shello. Leia antes de adicionar telas, modificar rotas ou navegar programaticamente.

---

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `index.tsx` | Router raiz — decide entre fluxo pré-hub (auth/onboarding) e hub principal (tabs) |
| `NavegacaoAbas.tsx` | Bottom Tab Navigator com 5 abas |
| `NavegacaoDiario.tsx` | Stack Navigator aninhado na aba Diário |

---

## Estrutura Completa de Navegação

```
NavigationContainer                   (App.tsx)
└── Stack.Navigator [animation: fade] (index.tsx — RootStack)
    │
    ├── [onboardingConcluido == false]
    │   ├── Stack.Screen "Autenticacao"  → TelaAutenticacao
    │   └── Stack.Screen "Onboarding"   → TelaOnboarding
    │
    └── [onboardingConcluido == true]
        └── Stack.Screen "Hub"          → NavegacaoAbas
            └── Tab.Navigator           (NavegacaoAbas.tsx)
                ├── Tab "HomeTab"       → HomeScreen
                ├── Tab "DiarioTab"     → NavegacaoDiario (Stack aninhado)
                │   └── Stack.Navigator [animation: slide_from_right]
                │       ├── Stack.Screen "ListaEntradas" → TelaDiario
                │       └── Stack.Screen "EntradaDiario" → TelaEntradaDiario
                │           [animation: slide_from_bottom]
                ├── Tab "ChatTab"       → TelaChat (botão central elevado)
                ├── Tab "TarefasTab"    → TelaTarefas
                └── Tab "PerfilTab"     → TelaPerfil
```

---

## Detalhe das Abas (`NavegacaoAbas.tsx`)

| Nome da tab | Ícone (Feather) | Rótulo | Componente |
|-------------|----------------|--------|------------|
| `HomeTab` | `home` | Início | `HomeScreen` |
| `DiarioTab` | `book-open` | Diário | `NavegacaoDiario` (Stack) |
| `ChatTab` | `zap` | Shello | `TelaChat` |
| `TarefasTab` | `check-square` | Tarefas | `TelaTarefas` |
| `PerfilTab` | `user` | Perfil | `TelaPerfil` |

> `ChatTab` usa `tabBarButton` customizado (`BotaoChat`) — botão circular elevado (`top: -20`) com `backgroundColor: ShelloTema.cores.marca`.

---

## Detalhe do Stack do Diário (`NavegacaoDiario.tsx`)

```ts
export type DiarioStackParamList = {
  ListaEntradas: undefined;
  EntradaDiario: { entrada?: EntradaDiario; nova?: boolean };
};
```

- `ListaEntradas` → `TelaDiario` (sem params)
- `EntradaDiario` → `TelaEntradaDiario` (params opcionais: entrada existente ou flag de criação nova)

---

## Decisão de Fluxo (`index.tsx`)

O router raiz lê `carregando` e `onboardingConcluido` do `ShelloContext`:

```
carregando == true  → renderiza Spinner (não monta navigator)
carregando == false → monta Stack
  onboardingConcluido == false → [Autenticacao, Onboarding]
  onboardingConcluido == true  → [Hub → NavegacaoAbas]
```

A transição entre os dois fluxos é automática: quando `concluirOnboarding()` ou `definirUsuario(nome, true)` é chamado, o contexto muda `onboardingConcluido` para `true`, e o React Navigation re-renderiza o Stack com as telas do hub.

---

## Navegar Programaticamente

### Dentro de uma aba (para outra aba)

```tsx
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type RootTabNavigation = BottomTabNavigationProp<{
  HomeTab: undefined;
  DiarioTab: undefined;
  ChatTab: undefined;
  TarefasTab: undefined;
  PerfilTab: undefined;
}>;

export default function HomeScreen() {
  const navigation = useNavigation<RootTabNavigation>();

  // Navegar para a aba de chat
  navigation.navigate('ChatTab');
}
```

### Dentro do Stack do Diário

```tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DiarioStackParamList } from '../navigation/NavegacaoDiario';

type DiarioNav = NativeStackNavigationProp<DiarioStackParamList>;

export default function TelaDiario() {
  const navigation = useNavigation<DiarioNav>();

  // Abrir tela de nova entrada
  navigation.navigate('EntradaDiario', { nova: true });

  // Abrir entrada existente
  navigation.navigate('EntradaDiario', { entrada: entradaSelecionada });
}
```

### Voltar

```tsx
navigation.goBack();
```

---

## Tipagem TypeScript para Parâmetros de Rota

### Acessar params em uma tela com `NativeStackScreenProps`

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DiarioStackParamList } from '../navigation/NavegacaoDiario';

type Props = NativeStackScreenProps<DiarioStackParamList, 'EntradaDiario'>;

export default function TelaEntradaDiario({ route, navigation }: Props) {
  const { entrada, nova } = route.params ?? {};
  // ...
}
```

### Definir um novo `ParamList`

```ts
// Na criação de um novo stack navigator:
export type MinhaStackParamList = {
  ListaPrincipal: undefined;                        // sem params
  TelaDetalhe: { id: string; titulo?: string };     // com params tipados
};

const Stack = createNativeStackNavigator<MinhaStackParamList>();
```

---

## Como Adicionar uma Nova Tela

### Caso 1 — Nova aba no Bottom Tab

1. Criar a tela em `src/screens/TelaNova.tsx`.
2. Em `NavegacaoAbas.tsx`, importar e adicionar:
```tsx
import TelaNova from '../screens/TelaNova';

// Dentro de Tab.Navigator:
<Tab.Screen
  name="NovaTab"
  component={TelaNova}
  options={{
    tabBarLabel: 'Nova',
    // tabBarIcon: ...
  }}
/>
```
3. Atualizar o `ParamList` de navegação das abas onde necessário.

### Caso 2 — Nova tela dentro do Stack do Diário

1. Criar a tela em `src/screens/`.
2. Em `NavegacaoDiario.tsx`:
```tsx
// Adicionar ao ParamList:
export type DiarioStackParamList = {
  ListaEntradas: undefined;
  EntradaDiario: { entrada?: EntradaDiario; nova?: boolean };
  NovaTelaDiario: { parametro: string };  // ← novo
};

// Adicionar Screen:
<Stack.Screen name="NovaTelaDiario" component={NovaTelaDiario} />
```

### Caso 3 — Novo Stack Navigator independente

1. Criar `src/navigation/NavegacaoNova.tsx` com `createNativeStackNavigator`.
2. Exportar o `ParamList` para tipagem.
3. Registrar o novo navigator como `component` de uma `Tab.Screen` em `NavegacaoAbas.tsx`.

---

## Animações de Transição

| Transição | `animation` |
|-----------|------------|
| Root Stack (auth ↔ hub) | `fade` |
| Stack do Diário (lista → entrada) | `slide_from_right` |
| TelaEntradaDiario (criar/editar) | `slide_from_bottom` |

Para manter consistência visual ao criar novos stacks, use `slide_from_right` como padrão e `slide_from_bottom` para modais/formulários.
