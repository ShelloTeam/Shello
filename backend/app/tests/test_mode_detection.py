import pytest
from app.services.mode_detection import detectar_modo, KEYWORDS_PRATICO


# ── 10 mensagens que DEVEM retornar PRATICO ──────────────────────────────────

MSGS_PRATICO = [
    ("keyword exata lowercase",         "criar tarefa para amanhã"),
    ("keyword no meio da frase",         "quero adicionar tarefa sobre reunião"),
    ("keyword com texto antes e depois", "precisa, lembrar de comprar pão hoje"),
    ("keyword uppercase na mensagem",    "NOVA TAREFA: ligar pro médico"),
    ("keyword com acentuação ao redor",  "é importante anota isso aqui"),
    ("keyword no final",                 "vou organizar"),
    ("keyword inglês to do",             "tenho um to do enorme hoje"),
    ("frase coloquial",                  "anote: reunião às 15h"),
    ("pergunta com keyword",             "o que devo fazer primeiro?"),
    ("keyword composta no centro",       "pode me ajuda a fazer esse relatório?"),
]

# ── 10 mensagens que DEVEM retornar PADRAO ────────────────────────────────────

MSGS_PADRAO = [
    ("saudação simples",                 "oi, tudo bem?"),
    ("pergunta filosófica",              "qual o sentido da vida?"),
    ("conversa casual",                  "estou me sentindo cansado hoje"),
    ("pedido de informação",             "me conta sobre a história do Brasil"),
    ("elogio",                           "você é muito inteligente"),
    ("despedida",                        "até mais, obrigado pela ajuda"),
    ("mensagem vazia com espaços",       "   "),
    ("emoji apenas",                     "😊👍"),
    ("número e pontuação",               "123!!! ???"),
    ("palavra similar mas não keyword",  "criação de valor no projeto"),
]


# ── Testes PRATICO ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("descricao,msg", MSGS_PRATICO)
def test_detecta_pratico(descricao, msg):
    assert detectar_modo(msg) == "PRATICO", (
        f"[FALHOU] Esperado PRATICO para: {descricao!r} | msg={msg!r}"
    )


# ── Testes PADRAO ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("descricao,msg", MSGS_PADRAO)
def test_detecta_padrao(descricao, msg):
    assert detectar_modo(msg) == "PADRAO", (
        f"[FALHOU] Esperado PADRAO para: {descricao!r} | msg={msg!r}"
    )


# ── Cobertura de todas as keywords ────────────────────────────────────────────

@pytest.mark.parametrize("keyword", KEYWORDS_PRATICO)
def test_cada_keyword_detecta_pratico(keyword):
    """Garante que cada keyword individualmente dispara PRATICO."""
    msg = f"preciso {keyword} agora"
    assert detectar_modo(msg) == "PRATICO", (
        f"Keyword {keyword!r} não disparou PRATICO"
    )


# ── Latência < 1ms ────────────────────────────────────────────────────────────

def test_latencia_menor_que_1ms():
    import time
    msg = "criar tarefa importante para hoje"
    inicio = time.perf_counter()
    for _ in range(1000):
        detectar_modo(msg)
    total = (time.perf_counter() - inicio) / 1000 * 1000  # ms por chamada
    assert total < 1.0, f"Latência média {total:.4f}ms excede 1ms"


# ── Case insensitive ──────────────────────────────────────────────────────────

def test_case_insensitive():
    assert detectar_modo("CRIAR TAREFA URGENTE") == "PRATICO"
    assert detectar_modo("Criar Tarefa Hoje") == "PRATICO"
    assert detectar_modo("ANOTE ISSO") == "PRATICO"


# ── Mensagem vazia ────────────────────────────────────────────────────────────

def test_mensagem_vazia_retorna_padrao():
    assert detectar_modo("") == "PADRAO"


# ── Resumo de taxa de acerto ─────────────────────────────────────────────────

def test_taxa_acerto_100_porcento():
    """Valida os 20 casos base de uma vez e reporta quais falharam."""
    falhas = []

    for descricao, msg in MSGS_PRATICO:
        if detectar_modo(msg) != "PRATICO":
            falhas.append(f"PRATICO esperado: {descricao!r} | {msg!r}")

    for descricao, msg in MSGS_PADRAO:
        if detectar_modo(msg) != "PADRAO":
            falhas.append(f"PADRAO esperado: {descricao!r} | {msg!r}")

    assert not falhas, "Falhas detectadas:\n" + "\n".join(falhas)