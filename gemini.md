# 🤖 DIRETRIZES DO AGENTE (GEMINI.MD)

Este documento define o comportamento, fluxo de trabalho, ferramentas e boas práticas esperadas do agente de IA (Antigravity/Gemini) durante o desenvolvimento do front-end do **Shello**.

---

## 🚀 1. Premissa Principal

Você está desenvolvendo na abordagem **Front-end First com dados mockados**.
- **Independência:** O backend está sendo desenvolvido em paralelo. Toda a lógica de comunicação com o servidor deve ser simulada via estados locais ou tempos de espera (`setTimeout`).
- **Contratos Claros:** Todas as requisições que futuramente baterão em rotas reais de API devem ser encapsuladas em funções na pasta `src/services/` e retornar tipos TypeScript bem definidos (`src/types/`).
- **Android First:** O foco é a execução e otimização para dispositivos Android.

---

## 🛠️ 2. Stack Tecnológica & Scripts do Projeto

O projeto utiliza a seguinte stack técnica no diretório `/frontend`:
- **Core:** Expo (versão ~54) + React Native + TypeScript.
- **Gerenciamento de Estado:** React Context API (pasta `src/contexts/`) para gerenciar informações globais (usuário, notas, tarefas).
- **Persistência de Dados:** `@react-native-async-storage/async-storage` para persistir dados locais (onboarding_done, histórico de notas e tarefas).
- **Estilização:** `StyleSheet.create` nativo do React Native (sem Tailwind ou styled-components).
- **Ícones:** Feather ou Lucide (via `@expo/vector-icons`).
- **UI Avançada:** Componentes interativos como Shimmer Loader e BottomSheet de insights desenvolvidos sob medida usando as APIs nativas do React Native (`Animated`, `Modal`).
- **Testes (TDD):** Jest + React Native Testing Library.

Para facilitar o desenvolvimento, existem comandos mapeados no **[Makefile](file:///home/dedeusgui/Dev/Shello/Makefile)** na raiz do projeto:

* **`make setup`**: Executa o script de inicialização do projeto (`setup.ps1` no Windows ou `setup.sh` no Linux/macOS) que instala as dependências do frontend (`npm install`).
* **`make dev`**: Inicia o servidor de desenvolvimento do Expo com a flag `--tunnel`. O agente ou usuário pode ler o QR Code gerado utilizando o aplicativo **Expo Go** em um celular Android para visualizar as modificações em tempo real.
* **`make check`**: Atalho para rodar a checagem de tipos estáticos do TypeScript (`npm run ts-check` dentro do diretório `/frontend`). **Deve ser executado com sucesso antes de finalizar qualquer tarefa.**
* **`make apk`**: Dispara a build do aplicativo móvel para a plataforma Android utilizando o EAS Build (`eas build --platform android --profile preview`), gerando um link para baixar o arquivo `.apk`.

---

## 🧪 3. Fluxo de Trabalho por TDD (Test-Driven Development)

Para garantir qualidade e prevenção de regressões, **toda** tarefa de implementação de tela ou componente deve seguir estritamente o ciclo TDD:

1. **Localize a tarefa** pendente em `tasks.md`.
2. **Crie o arquivo de testes** na pasta `__tests__` ou junto ao arquivo do componente (ex: `MyComponent.test.tsx`).
3. **Escreva as asserções básicas** de comportamento e layout (ex: verificar se renderiza os elementos, verificar se reage a cliques, testar estados mockados).
4. **Implemente a UI e o código** necessários no componente até que todos os testes passem.
5. **Verifique a tipagem:** Rode `make check` na raiz do projeto (ou `npm run ts-check` no `/frontend`) para garantir que o compilador TypeScript não encontre erros.
6. **Atualize o backlog:** Marque `[x]` no item concluído em `tasks.md`.
7. **Faça o commit:** Realize um commit focado apenas no escopo daquela tarefa concluída.

---

## 📦 4. Diretrizes de Commit (Commits Pequenos)

**É estritamente proibido submeter commits gigantes que misturem várias tarefas.**
- Cada task de `tasks.md` deve corresponder a **um ou poucos commits individuais**.
- Siga a especificação do **Conventional Commits**:
  - `feat: add auth screen and validation tests`
  - `fix: adjust container padding in diary screen`
  - `test: add tests for onboarding wizard navigation`
  - `chore: configure jest and testing library environment`

---

## ⚡ 5. Superpowers (Comandos) & Skills Disponíveis

Para acelerar e elevar a qualidade do desenvolvimento, o agente possui acesso a super-ferramentas integradas ao ecossistema:

### 🦸‍♂️ Superpowers (Slash Commands)
Recomende ou utilize estes comandos do chat para automatizar fluxos complexos:
* **`/goal`**: Utilize quando o desenvolvimento de uma tela ou refatoração for complexo e exigir que o agente trabalhe de maneira autônoma, iterativa e profunda até que o objetivo final de qualidade seja alcançado.
* **`/schedule`**: Utilize para agendar tarefas recorrentes em background, como por exemplo, rodar `make check` ou testes a cada 5 minutos para monitorar a integridade da branch durante edições massivas.
* **`/grill-me`**: Excelente para momentos em que houver dúvidas técnicas ou de design em uma tarefa. O agente deve entrevistar o desenvolvedor para alinhar o plano antes de escrever código.
* **`/teamwork-preview`**: Utilize para cenários onde a arquitetura exigir a cooperação de múltiplos sub-agentes simultâneos (ex: um focado em criar os testes e outro em implementar a UI).

### 🛠️ Skills Especializadas (Plugins & Ferramentas)
Ferramentas com instruções pré-carregadas que devem ser ativadas pelo agente quando apropriado:
* **`modern-web-guidance`**: **MANDATÓRIO.** Deve ser consultado antes de implementar layouts, interações de toque e componentes dinâmicos no React Native para aplicar práticas modernas de performance móvel.
* **`android-cli`**: Usado para diagnósticos e gerenciamento do ambiente do emulador Android, configurações do SDK e solução de problemas de build local.
* **`a11y-debugging`**: Deve ser usado para garantir acessibilidade nativa (Android accessibility checks), validando foco de botões, tags de leitores de tela nos inputs e contraste adequado no tema Sage.
* **`chrome-devtools`**: Usado para automatizar testes em navegadores, depurar logs de conexões ou performance de fluxos em modo web.

---

## 🏁 6. Checklist de Conclusão de uma Task

Antes de declarar uma tarefa concluída, confirme:
- [ ] O componente atende a todas as especificações visuais de `ui_ux.md`.
- [ ] A suite de testes passou sem falhas.
- [ ] O comando `make check` roda com sucesso sem nenhum erro de tipagem.
- [ ] O status correspondente no arquivo `tasks.md` foi atualizado.
- [ ] Foi realizado o commit incremental correspondente à tarefa no Git.
