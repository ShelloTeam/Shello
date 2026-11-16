# ADR-005 — Migração do Shello para Flutter, offline e mockado

## Status

`Accepted`

**Data:** 2026-11-15
**Autor(es):** Equipe Shello (migração conduzida com o agente Claude)

---

## Contexto

O Shello era um aplicativo React Native (Expo) com backend FastAPI, banco Supabase e
integração com a OpenAI. A versão atual precisa ser uma demonstração funcional, sem
dependência de internet, servidor, banco remoto ou chave de API, mantendo a identidade
visual e a experiência do produto.

Restrições relevantes:

- Não há autenticação real, LLM nem persistência remota na nova versão.
- A experiência do produto (telas, fluxos, regras de negócio para demonstração) deve
  ser preservada.
- O histórico da versão anterior precisa continuar acessível para consulta.

## Decisão

Decidimos reescrever o aplicativo inteiro em **Flutter 3.50 (Dart 3.14)**, com:

- **Dados locais e mockados**: repositórios sobre um armazenamento chave-valor
  (`shared_preferences` no dispositivo; memória nos testes). A seed de demonstração é
  tipada, determinística e restaurável.
- **Motor de respostas determinístico** no chat, sem LLM. Não se apresenta a resposta
  como gerada por IA real.
- **Autenticação simulada** com contas locais e senha guardada como hash SHA-256 salgado.
- **Riverpod** para estado, **go_router** para navegação (uma pilha por aba) e
  **Material 3** apenas como infraestrutura, com componentes próprios.
- **Regras de negócio** em código puro (`domain/`), testadas sem UI nem armazenamento.

A versão React Native e o backend FastAPI são removidos da branch ativa após a
validação. Permanecem acessíveis pelo commit `d970767`.

## Consequências

### Positivas
- O aplicativo roda sem rede, sem contas remotas e sem custos de API.
- Regras de negócio ficam testáveis e independentes da interface.
- Um único projeto, uma linguagem e um fluxo de build.

### Negativas / Trade-offs
- Dados são do dispositivo e não são separados por conta: duas contas no mesmo aparelho
  veem as mesmas entradas, tarefas e memórias.
- A segurança de senha é apenas simulada; não serve para produção.
- A resposta do chat não é inteligente: é uma demonstração de intenções e modelos fixos.
- Sincronização entre dispositivos e envio de e-mail deixam de existir.

### Neutras / Observações
- As regras de negócio de `docs/product/business-rules.md` continuam válidas e são
  aplicadas localmente (limite de 20 mensagens, arquivamento após 2h, regra D06, limite
  de 3 tarefas por confirmação do chat).
- Os ADRs 001 e 002 (FastAPI/Supabase e modelo de LLM fixo) ficam superados por este.

---

## Alternativas Consideradas

### Alternativa A: Manter React Native e remover apenas o backend
- **Por que descartada:** a demonstração ainda dependeria de um cliente Expo, do
  bundler e de dependências de terceiros que o requisito de offline não exige.
  O pedido era uma migração completa para Flutter.

### Alternativa B: Manter o backend local (FastAPI com SQLite)
- **Por que descartada:** adicionaria um processo a iniciar, quebrando a promessa de
  aplicativo autocontido e sem servidor.

### Alternativa C: Google Fonts em tempo de execução
- **Por que descartada:** exige rede para carregar a tipografia. Usamos a família
  serifada do sistema como título, sem dependência externa.

---

## Atualização (2026-11-15)

A consequência "dados não são separados por conta" foi superada pelo
[ADR-006](ADR-006-dados-por-conta.md): cada conta agora tem seus dados isolados no
aparelho.
