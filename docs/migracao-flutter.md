# Relatório da migração para Flutter

> Registro do que foi migrado do Shello (React Native + FastAPI) para o aplicativo Flutter
> offline e mockado, do que foi preservado, dos desvios conscientes e do que foi validado.
> Decisão registrada em [`adr/ADR-005-migracao-flutter-offline.md`](adr/ADR-005-migracao-flutter-offline.md).

## 1. Resultado

O aplicativo Flutter cobre todas as telas da versão original e as funcionalidades
ligadas a elas, sem rede, sem servidor, sem banco remoto e sem chave de API. A branch
`claude/shello-flutter-migration-mvkdoc` contém:

- o projeto Flutter na raiz (`lib/`, `test/`, `assets/`, `android/`, `web/`);
- a suíte de testes (domínio, repositórios, controllers, integração e interface);
- a documentação atualizada e o legado movido para `docs/legado/`;
- as capturas do build web em `docs/screenshots/flutter/`.

A versão React Native e o backend FastAPI foram removidos da árvore. A versão completa
continua acessível pela tag `legacy-react-native-fastapi` (commit `d970767`).

## 2. Mapeamento de telas

| Versão original (React Native) | Versão Flutter | Observação |
|---|---|---|
| `TelaAutenticacao.tsx` | `features/autenticacao/presentation/tela_autenticacao.dart` | Login, cadastro e recuperação. Autenticação simulada |
| `TelaOnboarding.tsx` | `features/onboarding/presentation/tela_onboarding.dart` | Três etapas, indicador de progresso e "Salvando..." |
| `HomeScreen.tsx` | `features/inicio/presentation/tela_inicio.dart` | Saudação, sequência, entradas, estatísticas e atalhos |
| `TelaDiario.tsx` | `features/diario/presentation/tela_diario.dart` | Lista agrupada, busca, filtros, exclusão com confirmação |
| `TelaEntradaDiario.tsx` | `features/diario/presentation/tela_entrada_diario.dart` | Editor, "+ Contexto Shello" e "Finalizar entrada" |
| `TelaChat.tsx` | `features/chat/presentation/tela_chat.dart` | Balões, sugestões, card de tarefa, limite e novo chat |
| `TelaTarefas.tsx` | `features/tarefas/presentation/tela_tarefas.dart` | Sua Jornada, filtros, rotinas por período e formulários |
| `TelaPerfil.tsx` | `features/perfil/presentation/tela_perfil.dart` | Nome, formalidade, tema, memórias, conta |
| (modal "Memórias" do perfil) | `features/perfil/presentation/tela_memorias.dart` | Busca, criação e exclusão de memórias |
| `NavegacaoAbas.tsx` | `app/shell/casca_principal.dart` | Cinco abas e botão central elevado do chat |
| `DialogShello.tsx` | `shared/widgets/shello_componentes.dart` (`confirmarAcao`) | Diálogo de confirmação com o estilo original |
| `FadeInView.tsx` | `shared/animations/animacoes_shello.dart` (`EntradaAnimada`) | Entrada suave na Home e na lista do diário |
| `ShelloContext.tsx` | `features/*/presentation/*_providers.dart` | Estado dividido por funcionalidade (Riverpod) |
| `tema.ts` | `app/theme/shello_tokens.dart` | Mesmos valores; paleta escura adicionada |
| `mockServicos.ts` | `core/mocks/dados_demonstracao.dart` | Seed tipada e determinística |

Mapeamento de regras:

| Regra de negócio | Onde está implementada |
|---|---|
| Limite de 20 mensagens por conversa | `features/chat/domain/motor_respostas.dart` (`RegrasConversa`) e `chat_repository.dart` |
| Arquivamento após 2h de inatividade | `RegrasConversa.deveArquivar` e `ChatRepository.conversaAtiva` |
| Regra D06: tarefa do chat sem data, máximo de 3 por confirmação | `features/tarefas/domain/regras_tarefas.dart` (`criarTarefasDoChat`) |
| Conteúdo de diário vazio ou acima de 10.000 caracteres é recusado | `features/diario/domain/entrada_diario.dart` (`validarConteudoDiario`) |
| Classificação de memórias por palavra-chave | `features/perfil/domain/memoria.dart` (`classificarTipoMemoria`) |
| Nome de referência com no máximo 30 caracteres | `features/preferencias/data/preferencias_repository.dart` |
| Validações de login e cadastro (mesmas mensagens) | `features/autenticacao/domain/validadores_auth.dart` |

## 3. Desvios conscientes em relação à versão original

| Ponto | Versão original | Versão Flutter | Motivo |
|---|---|---|---|
| Card de tarefa sugerida no chat | Existia, mas nunca era disparado (`setTarefaSugerida` não recebia valor) | Disparado pelo motor de respostas quando a mensagem pede uma tarefa | Requisito de demonstração: "criação de tarefas a partir de sugestões confirmadas" |
| Edição de tarefas e rotinas | Não existia | Toque no item abre o formulário preenchido | Requisito explícito de edição |
| Busca e filtros em tarefas | Não existiam | Busca por texto e filtros Todas, Pendentes, Concluídas e Atrasadas | Requisito explícito |
| Data de tarefa | Campo de texto `dd/mm/aaaa` | Seletor de data em pt-BR (`showDatePicker`) | Requisito "DatePicker apropriado" |
| Tema escuro | Não existia na interface | Alternância claro/escuro no perfil, persistida | Regra 5 das regras de negócio (`theme`) |
| Histórico de conversas | Sem interface | Conversas arquivadas em modo somente leitura | Regra de arquivamento com histórico local |
| Estatísticas da Home | Sequência e total de entradas | Faixa dos últimos sete dias, números de hoje e atalhos em lista (sem emojis nem grade de ícones) | Requisito "estatísticas de produtividade", com leitura de relance |
| Classificação de memórias | Regex sem a conjugação "prefiro" | Acrescenta "prefir" à regra de preferência | Correção: "Prefiro café…" caía em FATO |
| Título de entrada truncado | `…manhã....` (quatro pontos) | Sem pontuação repetida | Correção de acabamento (teste escrito antes) |
| Vínculo entrada → contexto | Comparação de texto com prefixo | Campo `origemEntradaId` na memória; estado de contexto derivado | Evita estado duplicado e comparações frágeis |
| Memórias de demonstração | Não podiam ser removidas | Todas podem ser removidas, com confirmação | Consistência; a restauração devolve a demonstração |
| Cadastro de nova conta | Forçava o onboarding | Forçava o onboarding, reiniciando as preferências | Mesmo comportamento, agora sem depender do servidor |
| Recuperação de senha | Enviava e-mail via backend | Mensagem genérica e aviso de que nenhum e-mail é enviado | Sem servidor nem envio de e-mail |
| Dados por conta | Isolados por usuário no servidor (RLS) | Isolados por conta no aparelho (`EscopoContaKeyValueStore`, ADR-006) | Sem servidor |
| Estados vazios | Ícone genérico | Mascote na expressão do momento | Identidade visual do Shello |
| Título do cartão de entrada | Primeiros 40 caracteres e prévia de 80, cortados no meio | Título só com a primeira frase, quando é curta e completa; o restante é prévia | Título e prévia repetiam o texto e cortavam frases |
| Voltar com texto não salvo | Descartava sem aviso | Pede confirmação, pelo botão ou pelo gesto do sistema | Evitar perda de texto |
| Criar conversa no chat | Ícone de recarregar no cabeçalho | Rótulo "Novo chat" | Ação clara |
| Botão de contexto no editor | Ícone de chip de processador | Só o texto | O ícone não tinha relação com a ação |
| Onboarding | Ícones genéricos, casa no cabeçalho e Voltar invisível na primeira etapa | Mascote nas etapas e no cabeçalho; Voltar só a partir da segunda etapa | Identidade visual e layout |

## 4. Dados de demonstração

- Conta: `demo@exemplo.com` / `Demo@1234` (usuária "Ana").
- Seed criada na primeira execução: seis entradas de diário em dias variados (sequência
  atual de 3 dias), oito tarefas (atrasada, de hoje, futuras, sem data e concluídas),
  três rotinas (manhã, tarde e noite), sete memórias (uma delas vinculada a uma entrada) e
  uma conversa arquivada.
- A restauração ("Restaurar demonstração", no perfil) regrava os dados de exemplo na conta
  demo, a partir do instante atual. O botão só aparece nessa conta e não desconecta.
- Cada conta tem seus próprios dados no aparelho (ADR-006). Uma conta criada pelo cadastro
  começa vazia, com o onboarding pendente.

## 5. Validação executada

| Verificação | Comando | Resultado |
|---|---|---|
| Análise estática | `flutter analyze` | Sem issues |
| Formatação | `dart format --set-exit-if-changed lib test` | Sem alterações pendentes |
| Testes | `flutter test` | 214 testes passando |
| Build web | `flutter build web --release --no-web-resources-cdn` | Build concluído (43 MB) |
| Build Android | `flutter build apk --debug` | **Não executado com sucesso** (ver seção 6) |

Evidência de TDD: cada módulo foi escrito a partir de testes. Antes da implementação,
as suítes correspondentes foram executadas e falharam ao carregar (módulos inexistentes).
A correção do título truncado foi confirmada como falha antes da alteração.

## 6. Limitações reais

1. **Sem build Android nem emulador.** O ambiente de execução não tem Android SDK
   (o host `dl.google.com` é bloqueado, e `flutter doctor` acusa a ausência do SDK) nem
   aceleração de hardware (`/dev/kvm`). A plataforma principal (Android) **não foi validada
   no dispositivo**.
2. **Capturas são do build web.** As imagens em `docs/screenshots/flutter/` vêm de um
   roteiro automatizado no Chromium, em viewport de 390×844 com densidade 2×. Não são
   capturas de emulador Android. As 16 imagens foram geradas do build final. No build final
   conferi visualmente as 05 e 07. As 03, 04, 06, 13 e 14 foram conferidas em builds
   intermediários da mesma fase, e as demais na revisão anterior. Vale uma passada geral
   antes de publicar.
3. **Tipografia serifada.** O título usa a família `serif` do sistema. No Chromium do
   ambiente de captura não há serifa instalada, então o título aparece em fonte sem
   serifa. No Android, a família `serif` resolve para Noto Serif.
4. **Glifos de emoji.** Ainda há emojis no texto da interface (🌿, 🤝, 📋, 💬, 🎉). No
   Chromium do ambiente, sem fonte de emoji, alguns podem aparecer como caixa. O cadeado do
   onboarding já é ícone. No Android ou em um navegador com fonte de emoji, eles renderizam
   normalmente.
5. **Campo "Adicionar novo contexto" da tela Memórias.** Na automação de navegador, o
   texto não entrou no campo de forma confiável. O mesmo fluxo de criação funciona pelo
   atalho "Adicionar Contexto" da Home (capturado na imagem 11), e o widget test de
   criação pela tela de memórias passa. **Recomenda-se verificar manualmente** essa
   digitação em dispositivo real, para descartar um problema específico do Flutter web.
6. **Autenticação simulada.** Não há servidor nem verificação de identidade. Senhas são
   guardadas como hash SHA-256 salgado, suficiente para a demonstração e insuficiente
   para produção.
7. **Motor de respostas.** As respostas do chat são modelos determinísticos escolhidos por
   palavras-chave. Não há compreensão de linguagem natural, e nada disso é apresentado
   como IA real.
8. **Sem sincronização.** Os dados de cada conta ficam no aparelho (ADR-006). Não há
   recuperação de conta nem acesso a partir de outro dispositivo.

## 7. Commits da migração

Na ordem em que foram feitos (branch `claude/shello-flutter-migration-mvkdoc`):

| Commit | Conteúdo |
|---|---|
| `96bb8e8` | Base Flutter com domínio puro e armazenamento local |
| `7211d3c` | Repositórios, controllers e seed de demonstração |
| `1307a52` | Telas, navegação e tema Shello |
| `9eef9d5` | Correções da revisão visual (título, botão compacto, animação, metadados) |
| `33ada18` | Capturas reais do build web |
| `d470f41` | Remoção do legado React Native e FastAPI, com a documentação histórica movida para `docs/legado/` |
| `2e50331` | README, agents.md, CLAUDE.md, índice da documentação, ADR-005 e este relatório |
| `7926e53` | Isolamento de dados por conta: `EscopoContaKeyValueStore` |
| `76a61b4` | Dados separados por conta, conta demo isolada e versão 2 do armazenamento |
| `56514be` | Data do editor vem do relógio do app e da entrada |
| `bfbcb70` | Rótulo "Para hoje" na Home |
| `342470e` | Faixa de constância semanal e números de hoje na Home |
| `8736681` | Mascote nos estados vazios e barra de progresso em Tarefas |
| `704c2a9` | Título do cartão de entrada é a primeira frase (diário) |
| `41882f8` | Confirmação antes de descartar alterações do editor |
| `61e1041` | Ação "Novo chat" com rótulo de texto |
| `3e0511b` | Onboarding com mascote, cadeado como ícone e Voltar a partir da segunda etapa |
| `9320898` | Botão de contexto do editor sem ícone de chip |
| `1b62ad1` | Título só com frase curta e completa |
| commits seguintes | Formatação dos testes do editor, capturas e este relatório |

Histórico anterior à migração: `d970767` (`chore: remove test files`), igual à tag
`legacy-react-native-fastapi`.
