import logging

logger = logging.getLogger(__name__)

KEYWORDS_PRATICO = [
    "criar tarefa",
    "nova tarefa",
    "adicionar tarefa",
    "lembrar de",
    "preciso fazer",
    "to do",
    "anota",
    "anote",
    "coloca na lista",
    "organizar",
    "planejar",
    "o que devo",
    "me ajuda a fazer",
    "como faco",
    "como fazer",
    "me lembra",
]


def detectar_modo(msg: str) -> str:
    """
    Detecta o modo da mensagem com base em keywords fixas.

    Retorna:
        'PRATICO' se a mensagem contiver alguma keyword da lista.
        'PADRAO'  caso contrário.

    Complexidade: O(k) onde k = len(KEYWORDS_PRATICO). Latência < 1ms.
    """
    m = msg.lower()
    modo = "PRATICO" if any(k in m for k in KEYWORDS_PRATICO) else "PADRAO"
    logger.info("detectar_modo | modo=%s | preview=%.60r", modo, msg)
    return modo