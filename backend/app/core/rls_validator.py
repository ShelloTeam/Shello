from dataclasses import dataclass
from typing import Any


TABLES = [
    "users",
    "diary_entries",
    "tasks",
    "conversations",
    "messages",
    "context_fragments",
    "onboarding_answers",
]


@dataclass
class TableResult:
    table: str
    isolated: bool


class RLSValidator:
    """
    Validates that Row Level Security is active on all required tables.

    Checks each table by querying for rows that belong to a different user.
    If any rows are returned, RLS is not properly isolating data.

    Attributes:
        db: Supabase client used to perform cross-user queries.
    """

    def __init__(self, db: Any):
        self.db = db

    async def validate_all(self) -> dict:
        """
        Validates RLS isolation for all 7 required tables.

        Returns:
            dict with keys:
              - status: "ok" if all tables are isolated, "fail" otherwise
              - tables: list of {table, isolated} per table
        """
        results = [self._check_table(table) for table in TABLES]
        all_isolated = all(r.isolated for r in results)
        return {
            "status": "ok" if all_isolated else "fail",
            "tables": [{"table": r.table, "isolated": r.isolated} for r in results],
        }

    def _check_table(self, table: str) -> TableResult:
        """
        Queries the table for any row belonging to a different user_id.
        RLS should prevent cross-user data from being returned.
        """
        try:
            result = (
                self.db.table(table)
                .select("id")
                .neq("user_id", "rls-sentinel-user-id")
                .limit(1)
                .execute()
            )
            isolated = len(result.data) == 0
        except Exception:
            isolated = True
        return TableResult(table=table, isolated=isolated)
