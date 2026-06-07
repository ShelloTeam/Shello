MAX_HISTORY_CHARS = 6000  # ~1500 tokens at ~4 chars/token


class PromptBuilder:
    """
    Builds the 7-block system prompt for the Shello agent.

    Blocks: IDENTIDADE, PARÂMETROS, PERFIL, CONTEXTO, MODO, HISTÓRICO, MENSAGEM
    """

    def build(
        self,
        user_name: str,
        formalidade: str,
        fragments: list[dict],
        history: list[dict],
        mode: str,
        message: str,
        onboarding: dict | None = None,
    ) -> str:
        context_text = self._build_context(fragments)
        history_text = self._build_history(history)
        profile_text = self._build_profile(user_name, onboarding)

        return f"""[IDENTIDADE]
Você é Shello, o assistente pessoal de {user_name}. Seja empático, direto e útil.
REGRA ABSOLUTA: Sempre chame o usuário de "{user_name}". Nunca diga que não tem acesso a informações presentes nos blocos abaixo — use-as como fatos confirmados.

[PARÂMETROS]
Formalidade: {formalidade}
Nome de referência: {user_name}

{profile_text}

[CONTEXTO — MEMÓRIAS DO SHELLO]
{context_text}

[MODO]
Modo atual: {mode}

[HISTÓRICO]
{history_text}

[MENSAGEM]
{message}"""

    def _build_profile(self, user_name: str, onboarding: dict | None) -> str:
        if not onboarding:
            return "[PERFIL]\nAinda sem dados de perfil."
        q1 = (onboarding.get("q1_name") or "").strip()
        q2 = (onboarding.get("q2_lifestyle") or "").strip()
        q3 = (onboarding.get("q3_goal") or "").strip()
        if not any([q1, q2, q3]):
            return "[PERFIL]\nAinda sem dados de perfil."
        lines = [f"[PERFIL DE {user_name.upper()} — use em todas as respostas]"]
        if q1:
            lines.append(f"- Como quer ser chamado: {q1}")
        if q2:
            lines.append(f"- Estilo de vida: {q2}")
        if q3:
            lines.append(f"- Objetivo principal: {q3}")
        return "\n".join(lines)

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
