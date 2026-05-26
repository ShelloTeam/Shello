import os
import time
import statistics
from typing import List

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

MODEL = "gpt-5.4-nano-2026-03-17"


mock_payload = {
    "empresa": "Centro Universitário Cesuca ",
    "produto": "Sistema Educacional",
    "segmento": "Educação",
    "pais": "Brasil",
    "usuarios_ativos": 1000,
    "objetivo": "Educação de qualidade",
}

def build_prompt(data: dict) -> str:
    return f"""
Empresa: {data["empresa"]}
Segmento: {data["segmento"]}
Produto: {data["produto"]}
País: {data["pais"]}
Usuários: {data["usuarios_ativos"]}

Objetivo:
{data["objetivo"]}

Retorne:
- riscos
- oportunidades
- recomendação técnica
- score 0-10
""".strip()


def call_model(prompt: str):
    start = time.perf_counter()

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.2,
        max_completion_tokens=400,
        messages=[
            {
                "role": "system",
                "content": "Você é um analista técnico senior."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    latency = time.perf_counter() - start

    content = response.choices[0].message.content

    usage = response.usage

    return {
        "content": content,
        "latency": latency,
        "input_tokens": usage.prompt_tokens,
        "output_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens
    }


def moderate_text(text: str):
    moderation = client.moderations.create(
        model="omni-moderation-latest",
        input=text
    )

    result = moderation.results[0]

    return {
        "flagged": result.flagged,
        "categories": result.categories
    }

INPUT_PRICE_PER_1M = 0.20
OUTPUT_PRICE_PER_1M = 1.25

def calculate_cost(input_tokens: int, output_tokens: int):
    input_cost = (input_tokens / 1_000_000) * INPUT_PRICE_PER_1M
    output_cost = (output_tokens / 1_000_000) * OUTPUT_PRICE_PER_1M

    total = input_cost + output_cost

    return round(total, 8)

def run_spike(iterations: int = 1):

    latencies: List[float] = []
    costs: List[float] = []

    print("=" * 80)
    print("INICIANDO SPIKE")
    print("=" * 80)

    for i in range(iterations):

        print(f"\nExecução {i + 1}/{iterations}")

        prompt = build_prompt(mock_payload)

        response = call_model(prompt)

        moderation = moderate_text(response["content"])

        cost = calculate_cost(
            response["input_tokens"],
            response["output_tokens"]
        )

        latencies.append(response["latency"])
        costs.append(cost)

        print(f"Latência: {response['latency']:.2f}s")
        print(f"Tokens entrada: {response['input_tokens']}")
        print(f"Tokens saída: {response['output_tokens']}")
        print(f"Custo estimado: ${cost}")
        print(f"Moderation flagged: {moderation['flagged']}")

    p50 = statistics.median(latencies)
    p95 = np.percentile(latencies, 95)

    avg_cost = sum(costs) / len(costs)

    print("\n" + "=" * 80)
    print("RESULTADO FINAL")
    print("=" * 80)

    print(f"P50 Latência: {p50:.2f}s")
    print(f"P95 Latência: {p95:.2f}s")
    print(f"Custo médio/chamada: ${avg_cost:.6f}")

    print("\nCRITÉRIOS:")

    print(f"P95 < 8s: {'OK' if p95 < 8 else 'FAIL'}")

    if avg_cost <= 0.001:
        print("Custo esperado: OK")
    else:
        print("Custo esperado: FAIL")


if __name__ == "__main__":
    run_spike()