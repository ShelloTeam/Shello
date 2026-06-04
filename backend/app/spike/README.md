# README — Spike de Performance e Custo com OpenAI API

## 📌 Sobre o projeto

Este projeto realiza um **Spike Técnico** utilizando a API da OpenAI para medir:

- Tempo de resposta (latência)
- Consumo de tokens
- Custo estimado por chamada
- Moderação de conteúdo
- Métricas estatísticas (P50 e P95)

O objetivo é validar se o modelo atende aos requisitos mínimos de:

- Performance
- Escalabilidade
- Custo operacional

---

# 📂 Estrutura do Projeto

```bash
.
├── main.py
├── .env
├── requirements.txt
└── README.md
```

---

# ⚙️ Tecnologias utilizadas

- Python 3.10+
- OpenAI SDK
- NumPy
- python-dotenv

---

# 📦 Instalação

## 1. Clone o projeto

```bash
git clone <repo>
cd <repo>
```

---

## 2. Crie um ambiente virtual

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Instale as dependências

```bash
pip install -r requirements.txt
```

---

# 📄 requirements.txt

```txt
openai
python-dotenv
numpy
```

---

# 🔑 Configuração da API

Crie um arquivo `.env` na raiz do projeto:

```env
OPENAI_API_KEY=sua_api_key_aqui
```

---

# 🚀 Como executar

```bash
python main.py
```

---

# 🧠 Modelo utilizado

O projeto utiliza o modelo:

```python
MODEL = "gpt-5.4-nano-2026-03-17"
```

---

# 📊 O que o Spike mede

A cada execução o sistema coleta:

| Métrica | Descrição |
|---|---|
| Latência | Tempo total da requisição |
| Input Tokens | Tokens enviados |
| Output Tokens | Tokens retornados |
| Total Tokens | Soma total |
| Custo estimado | Valor aproximado da chamada |
| Moderation | Verifica se o conteúdo foi sinalizado |

---

# 🔍 Explicação do Código

---

# 1. Importações

```python
import os
import time
import statistics
from typing import List

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
```

## Bibliotecas utilizadas

| Biblioteca | Função |
|---|---|
| `os` | Ler variáveis de ambiente |
| `time` | Medir latência |
| `statistics` | Cálculo de mediana |
| `numpy` | Percentil P95 |
| `dotenv` | Carregar `.env` |
| `openai` | Consumir API da OpenAI |

---

# 2. Inicialização da API

```python
load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)
```

## O que acontece aqui

- Carrega variáveis do `.env`
- Inicializa o cliente da API OpenAI

---

# 3. Payload Mockado

```python
mock_payload = {
    "empresa": "Centro Universitário Cesuca",
    "produto": "Sistema Educacional",
    "segmento": "Educação",
    "pais": "Brasil",
    "usuarios_ativos": 1000,
    "objetivo": "Educação de qualidade",
}
```

Esse objeto simula dados reais enviados para análise.

---

# 4. Construção do Prompt

```python
def build_prompt(data: dict) -> str:
```

Transforma o JSON em um prompt textual.

## Exemplo gerado

```txt
Empresa: Centro Universitário Cesuca
Segmento: Educação
Produto: Sistema Educacional
País: Brasil
Usuários: 1000

Objetivo:
Educação de qualidade

Retorne:
- riscos
- oportunidades
- recomendação técnica
- score 0-10
```

---

# 5. Chamada ao Modelo

```python
def call_model(prompt: str):
```

Responsável por:

- Enviar prompt ao modelo
- Medir tempo de resposta
- Capturar uso de tokens

---

## Requisição

```python
response = client.chat.completions.create(
```

## Configurações utilizadas

| Parâmetro | Valor |
|---|---|
| `model` | `gpt-5.4-nano-2026-03-17` |
| `temperature` | `0.2` |
| `max_completion_tokens` | `400` |

---

## Temperature

```python
temperature=0.2
```

Controla criatividade do modelo.

| Valor | Comportamento |
|---|---|
| `0.0` | Muito determinístico |
| `0.2` | Pouca variação |
| `1.0` | Criativo |
| `2.0` | Muito aleatório |

---

## Tokens

```python
usage.prompt_tokens
usage.completion_tokens
```

A API retorna automaticamente o consumo.

---

# 6. Moderação de Conteúdo

```python
def moderate_text(text: str):
```

Utiliza:

```python
model="omni-moderation-latest"
```

Para verificar:

- Violência
- Conteúdo sensível
- Discurso ofensivo
- Spam
- Etc.

---

# 7. Cálculo de Custo

```python
INPUT_PRICE_PER_1M = 0.20
OUTPUT_PRICE_PER_1M = 1.25
```

Define preço por 1 milhão de tokens.

---

## Fórmula

```python
input_cost = (input_tokens / 1_000_000) * INPUT_PRICE_PER_1M
output_cost = (output_tokens / 1_000_000) * OUTPUT_PRICE_PER_1M

total = input_cost + output_cost
```

---

## Exemplo

Se consumir:

- 1000 tokens entrada
- 500 tokens saída

Resultado:

```txt
Entrada:
1000 / 1_000_000 * 0.20 = 0.0002

Saída:
500 / 1_000_000 * 1.25 = 0.000625

Total:
0.000825
```

---

# 8. Execução do Spike

```python
def run_spike(iterations: int = 1):
```

Executa múltiplos testes automaticamente.

---

## Fluxo

```txt
1. Monta prompt
2. Chama modelo
3. Faz moderação
4. Calcula custo
5. Armazena métricas
6. Calcula estatísticas finais
```

---

# 9. Métricas Estatísticas

## P50

```python
p50 = statistics.median(latencies)
```

Representa a mediana das latências.

---

## P95

```python
p95 = np.percentile(latencies, 95)
```

Representa o pior cenário dos 95% melhores tempos.

Muito usado em:

- APIs
- Observabilidade
- Performance
- SRE

---

# 10. Critérios de Aprovação

## Performance

```txt
P95 < 8s
```

A API deve responder em menos de 8 segundos.

---

## Validação de custo

```python
if avg_cost <= 0.001
```

Cada requisição deve custar no máximo:

```txt
$0.001
```

---

# 📈 Exemplo de saída

```txt
================================================================================
INICIANDO SPIKE
================================================================================

Execução 1/1

Latência: 2.14s
Tokens entrada: 120
Tokens saída: 230
Custo estimado: $0.00031
Moderation flagged: False

================================================================================
RESULTADO FINAL
================================================================================

P50 Latência: 2.14s
P95 Latência: 2.14s
Custo médio/chamada: $0.000310

CRITÉRIOS:

P95 < 8s: OK
Custo esperado: OK
```

---

# 🛠 Possíveis melhorias

## Melhorias técnicas

- Adicionar logs estruturados
- Exportar métricas para CSV
- Salvar resultados em banco
- Paralelizar chamadas
- Adicionar retry automático
- Implementar benchmark concorrente

---

## Melhorias de observabilidade

- Integração com Prometheus
- Dashboard Grafana
- Tracing com OpenTelemetry
- Alertas de custo

---

# 📌 Casos de uso

Esse spike pode ser usado para validar:

- Assistentes IA
- APIs LLM
- Sistemas RAG
- Chatbots
- Análise de documentos
- Automação corporativa

---

# 🔒 Segurança

Nunca exponha sua API Key em:

- GitHub
- Frontend
- Logs públicos

Use sempre:

```env
.env
```

E adicione no `.gitignore`:

```txt
.env
```

---

# 📚 Referências

- OpenAI Platform Docs
- OpenAI Pricing
- Python Dotenv
- NumPy Documentation