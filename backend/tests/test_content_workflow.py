from sqlalchemy.dialects import postgresql

from app.api.v1.endpoints.kawruh import build_search_statement
from app.schemas.admin import KawruhCreate, ParibasanCreate


def test_new_admin_content_defaults_to_draft() -> None:
    kawruh = KawruhCreate(ngoko="anyar", bahasa_indonesia="baru")
    paribasan = ParibasanCreate(teks="Tuladha", tegese="Contoh", kategori="paribasan")
    assert kawruh.status == "draft"
    assert paribasan.status == "draft"


def test_public_kawruh_query_only_returns_published_content() -> None:
    sql = str(
        build_search_statement("mangan").compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )
    assert "kawruh_basa.status = 'published'" in sql
