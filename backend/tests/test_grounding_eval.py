from evaluate_grounding import evaluate
from app.services.knowledge import static_sources


def test_grounding_evaluation_thresholds() -> None:
    result = evaluate()
    assert result["cases"] >= 20
    assert result["hit_at_3"] >= 0.8
    assert result["citation_coverage"] == 1.0


def test_evaluasi_mencakup_semua_kategori_sumber() -> None:
    """Eval tidak boleh diam-diam menguji subset korpus yang dipakai AI."""
    categories = {source["category"] for source in static_sources()}
    assert len(categories) >= 10
    # Sebelumnya evaluate() hanya memakai AKSARA_SOURCES + _macapat_sources()
    # (32 dari 102 sumber), sehingga 6 kategori baru tidak pernah diuji.
    assert len(static_sources()) >= 100
