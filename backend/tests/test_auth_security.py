"""Regresi untuk secret JWT dan seeder admin."""

import pytest

from app.core import auth
from app.core.config import settings
from app.core.auth import JwtSecretMissingError


def test_token_creation_ditolak_saat_secret_kosong(monkeypatch) -> None:
    monkeypatch.setattr(settings, "jwt_secret_key", "")
    with pytest.raises(JwtSecretMissingError):
        auth.create_access_token({"sub": "admin"})


def test_token_verification_ditolak_saat_secret_kosong(monkeypatch) -> None:
    monkeypatch.setattr(settings, "jwt_secret_key", "")
    assert auth.decode_token("token.apa.saja") is None
    assert auth.get_token_type("token.apa.saja") is None


def test_token_berfungsi_saat_secret_diisi(monkeypatch) -> None:
    monkeypatch.setattr(settings, "jwt_secret_key", "secret-untuk-test")
    token = auth.create_access_token({"sub": "admin"})
    payload = auth.decode_token(token)
    assert payload is not None
    assert payload["sub"] == "admin"
    assert payload["type"] == "access"


def test_seeder_tidak_buat_admin_tanpa_password(monkeypatch) -> None:
    import seed_db

    class FakeDb:
        def scalar(self, _query):
            raise AssertionError("seeder tidak boleh menyentuh DB tanpa password")

        def add(self, _obj):
            raise AssertionError("seeder tidak boleh menambah admin tanpa password")

    monkeypatch.setattr(seed_db, "DEFAULT_ADMIN_PASSWORD", "")
    assert seed_db.seed_admin_user(FakeDb()) == (0, 0)
