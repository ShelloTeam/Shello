MAX_HISTORY_CHARS = 6000  # ~1500 tokens at ~4 chars/token


class PromptBuilder:
    """
    Builds the 6-block system prompt for the Shello agent.

    Blocks: IDENTIDADE, PARÂMETROS, CONTEXTO, MODO, HISTÓRICO, (user message appended by caller)
    """

    def build(
        self,
        user_name: str,
        formalidade: str,
        fragments: list[dict],
        history: list[dict],
        mode: str,
        message: str,
    ) -> str:
        """
        Assembles all 6 prompt blocks into the final system prompt.

        Args:
            user_name: How the agent should refer to the user.
            formalidade: Tone level ("baixa", "media", "alta").
            fragments: Active context fragments for this user.
            history: Prior conversation turns (truncated to ~1500 tokens).
            mode: "PRATICO" or "PADRAO".
            message: Current user message (appended as last block).

        Returns:
            Complete system prompt string.
        """
        context_text = self._build_context(fragments)
        history_text = self._build_history(history)

        return f"""[IDENTIDADE]
Você é Shello, assistente pessoal inteligente de {user_name}.
Seja empático, direto e útil.

[PARÂMETROS]
Formalidade: {formalidade}
Nome de referência: {user_name}

[CONTEXTO]
{context_text}

[MODO]
Modo atual: {mode}

[HISTÓRICO]
{history_text}

[MENSAGEM]
{message}"""

    def _build_context(self, fragments: list[dict]) -> str:
        if not fragments:
            return "Nenhum fragmento de contexto disponível."
        return "\n".join(
            f"- [{f.get('category', 'geral')}] {f.get('content', '')}"
            for f in fragments
        )

    def _build_history(self, history: list[dict]) -> str:
        if not history:
            return "Início da conversa."
        truncated = self._truncate_history(history)
        return "\n".join(
            f"{turn['role'].upper()}: {turn['content']}"
            for turn in truncated
        )

    def _truncate_history(self, history: list[dict]) -> list[dict]:
        """Truncates history to MAX_HISTORY_CHARS from the most recent turns."""
        result = []
        total = 0
        for turn in reversed(history):
            size = len(turn.get("content", ""))
            if total + size > MAX_HISTORY_CHARS:
                break
            result.insert(0, turn)
            total += size
        return result
