"""Run the deterministic grounding evaluation set: python evaluate_grounding.py."""

import json
from pathlib import Path

from app.services.knowledge import AKSARA_SOURCES, _macapat_sources, rank_sources


def evaluate() -> dict[str, float | int]:
    cases = json.loads((Path(__file__).parent / "evals" / "grounding.json").read_text(encoding="utf-8"))
    sources = [*AKSARA_SOURCES, *_macapat_sources()]
    hits = citation_covered = 0
    for case in cases:
        ranked = rank_sources(case["query"], sources, limit=3)
        hits += any(
            (not case.get("expected_title") or source["title"] == case["expected_title"])
            and (not case.get("expected_category") or source["category"] == case["expected_category"])
            for source in ranked
        )
        citation_covered += bool(ranked and all(source["citation"] for source in ranked))
    total = len(cases)
    return {"cases": total, "hit_at_3": round(hits / total, 3), "citation_coverage": round(citation_covered / total, 3)}


if __name__ == "__main__":
    print(json.dumps(evaluate(), indent=2))
