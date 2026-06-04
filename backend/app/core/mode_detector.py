PRATICO_KEYWORDS = {
    "tarefa", "lembrar", "lembra", "agendar", "agenda", "criar",
    "cria", "adicionar", "adiciona", "todo", "to-do", "fazer",
    "compromisso", "prazo", "deadline",
}


def detect_mode(message: str) -> str:
    """
    Detects conversation mode from user message.

    Returns "PRATICO" if any task-related keyword is found (case-insensitive),
    otherwise returns "PADRAO".
    """
    lower = message.lower()
    for keyword in PRATICO_KEYWORDS:
        if keyword in lower:
            return "PRATICO"
    return "PADRAO"
