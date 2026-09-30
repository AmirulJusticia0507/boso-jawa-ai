from evaluate_grounding import evaluate


def test_grounding_evaluation_thresholds() -> None:
    result = evaluate()
    assert result["cases"] >= 5
    assert result["hit_at_3"] >= 0.8
    assert result["citation_coverage"] == 1.0
