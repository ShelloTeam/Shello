# 🎨 DIRETRIZES VISUAIS & ESPECIFICAÇÕES DE UI/UX — SHELLO

Este documento serve como referência de design para o front-end móvel do aplicativo **Shello**. Ele define a identidade visual, tipografia, paleta de cores e comportamento detalhado de experiência do usuário (UX) para cada tela.

---

## 🐢 1. Identidade Visual & Logo

O mascote oficial do projeto é a tartaruga **Shello**. A logo oficial está localizada na raiz do projeto:

![Shello Logo](logoshello.jpeg)

---

## 🎨 2. Design Tokens (Sage Theme)

Toda a estilização deve seguir estritamente os tokens abaixo para garantir uma estética minimalista, orgânica e relaxante.

### Paleta de Cores (Definida em `src/styles/theme.ts`)

| Token | Valor Hex | Descrição |
| :--- | :--- | :--- |
| **`background`** | `#F7F6F0` | Creme/Off-white suave para o fundo geral do app |
| **`surface`** | `#FFFFFF` | Branco puro para cards de conteúdo, inputs e modais |
| **`textPrimary`** | `#2D3A32` | Verde floresta escuro para títulos e textos principais |
| **`textSecondary`** | `#6C757D` | Cinza neutro para legendas, placeholders e metadados |
| **`brandPrimary`** | `#5E836A` | Verde Sálvia oficial da tartaruga Shello |
| **`brandLight`** | `#D6E2D8` | Verde clarinho para badges ativos (ex: streaks) |
| **`accentTerracota`** | `#EADCD6` | Salmão/Terracota suave para CTAs secundários e botões |
| **`error`** | `#DC3545` | Vermelho padrão para sinalização de atrasos ou exclusões |

### Tipografia (`Roboto` Nativa Android)

A tipografia deve utilizar a família de fontes nativas `Roboto` no Android para obter alta performance e carregamento instantâneo.

* **Títulos de Seção / Saudações:** `Roboto-Bold` (24px), cor `textPrimary`.
* **Corpo de Texto (Notas/Chat):** `Roboto-Regular` (15px), cor `textPrimary` ou `textSecondary`, aplicando obrigatoriamente `lineHeight: 22` para conforto ocular em leituras longas.
* **Badges / Legendas:** `Roboto-Medium` (12px) com estilo em caixa alta ou capitalizado para tags de leitura rápida.

### Ícones

* **Biblioteca Padrão:** `@expo/vector-icons` utilizando exclusivamente a família **Feather** ou **Lucide** para traços finos, limpos e modernos que harmonizam com o tema orgânico.

### Formas e Espaçamento

* **Estilo de Estilização:** CSS-in-JS está proibido. Use a API `StyleSheet.create` padrão do React Native.
* **Cantos Arredondados:** Cards principais e botões devem possuir cantos muito arredondados para passar um ar orgânico e suave (`borderRadius: 24` ou `borderRadius: 32`).
* **Paddings & Margens:** Espaçamentos generosos (padrão `16px` a `24px`) para evitar sensação de telas apertadas ou sobrecarregadas de informação.

---

## 🏗️ 3. Arquitetura de Estado e Dados Mockados

Para dar suporte ao **Front-end First com dados mockados**:

1. **Camada de Serviços (`src/services/`):**
   - Toda leitura/escrita de dados (diário, tarefas, memórias, perfil) deve ocorrer por funções assíncronas em arquivos na pasta `src/services/`.
   - Estas funções devem simular a latência de rede usando `setTimeout` e salvar os dados no dispositivo persistindo via `@react-native-async-storage/async-storage`.
2. **Gerenciamento de Estado Global (`src/contexts/`):**
   - O aplicativo usará a **React Context API** nativa (ex: `ShelloContext`) para propagar o estado das notas, tarefas e perfil de maneira simples e reativa por toda a árvore de componentes.

---

## 📱 4. Detalhamento de Interface por Tela

### 🔒 FLUXO PRÉ-HUB (Autenticação e Carga de Contexto)

#### 1. Tela de Autenticação (`AuthScreen.tsx`)
* **Objetivo:** Login simplificado para entrada inicial do usuário.
* **Layout & Estética:**
  - Fundo creme (`background`).
  - Centralizar a imagem do mascote Shello (`logoshello.jpeg`) no topo com um tamanho harmonioso (ex: `width: 120, height: 120`, redondo ou com borda suave).
  - Inputs de email e senha encapsulados em containers brancos (`surface`) com `borderRadius: 24`.
* **UX & Comportamento:**
  - Alternador de estado local rápido (`currentForm: 'login' | 'register' | 'recover'`). A transição entre os formulários deve ser instantânea, sem recarregar a tela.
  - Ao clicar em "Entrar" ou "Cadastrar", exibir um indicador de carregamento discreto (`ActivityIndicator` na cor `brandPrimary`), simular um delay de `800ms` e navegar para o Onboarding.

#### 2. Tela de Onboarding Sequencial (`OnboardingScreen.tsx`)
* **Objetivo:** Coleta inicial de contexto de forma amigável e sem fricção.
* **Layout & Estética:**
  - Fluxo obrigatório dividido em 3 etapas de formulário horizontal estilo carrossel (`ViewPager` ou controle por índice de estado).
  - Indicador visual discreto no topo indicando o progresso (ex: bolinhas `brandPrimary` para ativo, `brandLight` para inativo).
* **Campos das Etapas:**
  - *Passo 1:* "Como prefere ser chamado?" $\rightarrow$ Campo de texto simples com placeholder "Seu nome...".
  - *Passo 2:* "Em uma frase, como descreveria seu estilo de vida atual?" $\rightarrow$ Campo de texto livre.
  - *Passo 3:* "Qual uma coisa que você está tentando melhorar agora?" $\rightarrow$ Campo de texto livre.
* **UX & Comportamento:**
  - Ao concluir a última etapa, salvar os dados temporariamente no `ShelloContext` e persistir no `AsyncStorage`, navegando de forma fluida para a tela principal (Hub) após setar `onboarding_done = true`.

---

### 🌿 FLUXO DO HUB PRINCIPAL (`BottomTabNavigator`)

A navegação principal do aplicativo deve utilizar o sistema de abas inferiores nativas do Android (`@react-navigation/bottom-tabs`), customizado com fundo `#FFFFFF` (`surface`), ícones Feather na cor `brandPrimary` (quando ativos) e `textSecondary` (quando inativos). As transições de troca de aba devem ser instantâneas ($<300\text{ms}$).

#### 3. Tela Home (`HomeScreen.tsx`)
* **Layout & Estética:**
  - Saudação personalizada e dinâmica: "Good morning, [Nome]" com tipografia `Roboto-Bold` (24px) carregada do contexto.
  - **Cards de Métricas:** Dois badges horizontais destacados com `borderRadius: 24`:
    - Badge verde claro (`brandLight`) com texto "7 day streak" 🔥.
    - Badge terracota suave (`accentTerracota`) com texto "24 entries" ✍️.
  - **Atalhos Rápidos:** Dois cards grandes clicáveis em formato de botão vertical:
    - "Escrever no Diário" $\rightarrow$ Leva para a aba Diário.
    - "Conversar com o Shello" $\rightarrow$ Leva para a aba Chat.

#### 4. Tela do Diário (`DiaryScreen.tsx`)
* **Layout & Estética:**
  - Input de texto grande para digitação livre do diário, estilo página em branco: fundo limpo (`surface`), sem bordas retangulares rígidas, com placeholder sutil "Start writing...".
  - Seção de histórico de notas logo abaixo com cabeçalhos agrupados por data ("Today", "Yesterday", "Last Week").
* **UX & Comportamento:**
  - Lista de notas antigas renderizada via `FlatList` a partir do `ShelloContext` (sincronizada com `AsyncStorage`).
  - Ao clicar em "Salvar Nota", o botão mostra estado de salvando e, após `1.5 segundos`, exibe um *BottomSheet* customizado (usando `Modal` nativo com transição de slide) com feedback da IA:
    > "Shello identificou um novo fato sobre você: **[Fato Mockado]**. Deseja salvar no seu contexto?"
    - O modal apresenta dois botões arredondados: `[Guardar]` (salva no contexto local/AsyncStorage e fecha com animação) e `[Ignorar]` (fecha sem alterar o estado).

#### 5. Tela do Agente Shello (`ChatScreen.tsx`)
* **Layout & Estética:**
  - Cabeçalho minimalista com avatar circular da tartaruga Shello e status "Shello - Your AI Companion".
  - Balões de mensagem arredondados (`borderRadius: 24`):
    - Balões da IA: Alinhados à esquerda, cor de fundo `brandLight`, texto `textPrimary`.
    - Balões do Usuário: Alinhados à direita, cor de fundo `brandPrimary`, texto `#FFFFFF`.
* **UX & Comportamento:**
  - Envio de mensagem: adiciona o balão do usuário imediatamente no histórico, limpa o campo e rola a lista para o fim.
  - **Pensamento da IA (Skeleton Shimmer):** Exibir um componente de loading contendo barrinhas com efeito de shimmer por `3 segundos`, feito de maneira customizada através da API `Animated` do React Native.
  - **Injeção de Resposta:** Após os 3 segundos, exibe a resposta mockada acompanhada de um card interativo no rodapé do balão:
    > "Criar tarefa: [Título Mockado]?"
    - Com botões rápidos `[Confirmar]` (insere a tarefa no contexto/AsyncStorage de ToDo) e `[Cancelar]` (descarta a ação).

#### 6. Tela de Tarefas (`ToDoScreen.tsx`)
* **Layout & Estética:**
  - Filtro tipo tab-bar no topo: "Active" e "Completed".
  - Lista de cards de tarefas com checkbox arredondado.
* **UX & Regra de Negócio Visual:**
  - Tarefas atrasadas/vencidas devem possuir visual de destaque: contorno ou borda lateral esquerda proeminente na cor `error` (`#DC3545`).
  - Marcar o checkbox deve disparar uma animação de fade-out ou transição visual suave (usando `Animated`), removendo o item de "Active" e adicionando a "Completed".

#### 7. Tela de Perfil e Painel (`ProfileScreen.tsx`)
* **Layout & Estética:**
  - Opções estáticas para gerenciar a personalidade da IA (Seletor visual do nível de Formalidade: Baixa, Média, Alta).
  - **Context Dashboard (Painel de Memória):** Uma seção dedicada mostrando o que a IA "sabe" sobre o usuário, disposta em pequenos cards horizontais (`borderRadius: 16`):
    - *[PREFERÊNCIA]* "Prefere ser chamado de Alex".
    - *[FATO]* "Trabalha no regime freelancer pela manhã".
    - *[OBJETIVO]* "Deseja melhorar a consistência nos estudos".
* **UX & Comportamento:**
  - Cada micro-card de contexto possui um botão `[Remover]` (ícone Feather de lixeira ou texto discreto). Ao clicar, o card desaparece da tela com animação de fade-out suave (usando `Animated`).
