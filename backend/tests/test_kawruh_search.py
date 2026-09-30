from sqlalchemy.dialects import postgresql

from app.api.v1.endpoints.kawruh import build_search_statement


def compile_query(query: str) -> str:
    statement = build_search_statement(query)
    return str(
        statement.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


def test_search_uses_trigram_similarity_for_typo_tolerance() -> None:
    sql = compile_query("dahar")
    assert "similarity(kawruh_basa.ngoko, 'dahar')" in sql
    assert ">= 0.2" in sql


def test_search_ranks_exact_and_prefix_matches_first() -> None:
    sql = compile_query("mangan")
    assert "CASE WHEN" in sql
    assert "lower(kawruh_basa.ngoko) = 'mangan'" in sql
    assert "ILIKE 'mangan%%'" in sql
    assert "greatest(" in sql


def test_search_normalizes_outer_whitespace_and_case() -> None:
    sql = compile_query("  MANGAN  ")
    assert "'mangan'" in sql
    assert "MANGAN" not in sql
