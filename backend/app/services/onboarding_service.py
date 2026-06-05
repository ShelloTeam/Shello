import logging
from app.repositories.onboarding_repository import OnboardingRepository
from app.schemas.onboarding import OnboardingSubmit, OnboardingStatusResponse

logger = logging.getLogger(__name__)


class OnboardingService:
    def __init__(self, repo: OnboardingRepository) -> None:
        self._repo = repo

    def get_status(self, user_id: str) -> OnboardingStatusResponse:
        """
        Retorna estado atual do onboarding.
        Permite ao frontend retomar de onde parou se app foi fechado.
        """
        user = self._repo.get_user(user_id)
        if not user:
            raise ValueError("Usuário não encontrado.")

        if user["onboarding_done"]:
            return OnboardingStatusResponse(
                onboarding_done=True,
                q1_answered=True,
                q2_answered=True,
                q3_answered=True,
            )

        answers = self._repo.get_onboarding_answers(user_id)
        if not answers:
            return OnboardingStatusResponse(
                onboarding_done=False,
                q1_answered=False,
                q2_answered=False,
                q3_answered=False,
            )

        return OnboardingStatusResponse(
            onboarding_done=False,
            q1_answered=bool(answers.get("q1_name")),
            q2_answered=bool(answers.get("q2_lifestyle")),
            q3_answered=bool(answers.get("q3_goal")),
        )

    def complete_onboarding(self, user_id: str, data: OnboardingSubmit) -> None:
        """
        Executa o fluxo completo de onboarding:
        1. Valida que onboarding ainda não foi feito
        2. Atualiza users.nome_referencia
        3. Salva respostas em onboarding_answers
        4. Insere 3 fragmentos em context_fragments
        5. Marca onboarding_done = true

        Raises:
            ValueError: onboarding já concluído.
        """
        user = self._repo.get_user(user_id)
        if not user:
            raise ValueError("Usuário não encontrado.")

        if user["onboarding_done"]:
            raise ValueError("Onboarding já foi concluído.")

        # P1 → atualiza nome de referência
        self._repo.update_user_nome_referencia(user_id, data.q1_name)

        # Salva respostas brutas
        self._repo.save_onboarding_answers(
            user_id=user_id,
            q1_name=data.q1_name,
            q2_lifestyle=data.q2_lifestyle,
            q3_goal=data.q3_goal,
        )

        # Monta os 3 fragmentos de contexto iniciais
        fragments = [
            {
                "content": f"Prefere ser chamado de {data.q1_name}",
                "category": "preferencia",
            },
            {
                "content": f"Estilo de vida: {data.q2_lifestyle}",
                "category": "fato",
            },
            {
                "content": f"Quer melhorar: {data.q3_goal}",
                "category": "objetivo",
            },
        ]
        self._repo.insert_context_fragments(user_id, fragments)

        # Marca como concluído — operação final e idempotente
        self._repo.mark_onboarding_done(user_id)

        logger.info("Onboarding concluído: user_id=%s", user_id)