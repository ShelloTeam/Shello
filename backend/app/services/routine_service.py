from __future__ import annotations
from app.models.routine_models import Routine
from app.repositories.routine_repository import RoutineRepository


class RoutineService:
    def __init__(self, repository: RoutineRepository) -> None:
        self.repository = repository

    async def list(self, user_id: str) -> list[Routine]:
        rows = self.repository.list_by_user(user_id=user_id)
        return [Routine(**row) for row in rows]

    async def create(
        self,
        user_id: str,
        nome: str,
        atividades: list[str],
        periodo: str,
    ) -> Routine:
        row = self.repository.create(
            user_id=user_id, nome=nome, atividades=atividades, periodo=periodo,
        )
        return Routine(**row)

    async def update(
        self,
        routine_id: str,
        user_id: str,
        nome: str | None = None,
        atividades: list[str] | None = None,
        periodo: str | None = None,
    ) -> Routine:
        fields = {}
        if nome is not None:
            fields["nome"] = nome
        if atividades is not None:
            fields["atividades"] = atividades
        if periodo is not None:
            fields["periodo"] = periodo

        row = self.repository.update(routine_id=routine_id, user_id=user_id, fields=fields)
        if row is None:
            raise KeyError(f"Rotina {routine_id} não encontrada.")
        return Routine(**row)

    async def delete(self, routine_id: str, user_id: str) -> bool:
        deleted = self.repository.delete(routine_id=routine_id, user_id=user_id)
        if not deleted:
            raise KeyError(f"Rotina {routine_id} não encontrada.")
        return True
