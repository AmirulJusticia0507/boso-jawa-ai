"""Seed all reference data without duplicating existing records.

Run from ``backend/`` after applying migrations::

    alembic upgrade head
    python seed_db.py
"""

from sqlalchemy import select

from app.core.auth import get_password_hash
from app.core.database import SessionLocal
from app.models.aksara import AksaraJawa
from app.models.admin_user import AdminRole, AdminUser
from app.models.kawruh import KawruhBasa
from app.models.macapat import Macapat
from app.models.paribasan import Paribasan
from app.services.aksara_engine import CARAKAN
from app.services.macapat_checker import PAUGERAN
from seed_paribasan import DATA as PARIBASAN_DATA

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"

KAWURUH_DATA = [
    ("aku", "kula", "dalem", "saya", "Tembung Sesulih", "Kula badhe tindak pasar."),
    (
        "kowe",
        "sampeyan",
        "panjenengan",
        "kamu",
        "Tembung Sesulih",
        "Panjenengan badhe tindak pundi?",
    ),
    ("mangan", "nedha", "dhahar", "makan", "Tembung Kriya", "Bapak dhahar sekul."),
    ("lunga", "kesah", "tindak", "pergi", "Tembung Kriya", "Ibu tindak dhateng pasar."),
    ("turu", "tilem", "sare", "tidur", "Tembung Kriya", "Simbah sampun sare."),
    ("omah", "griya", "dalem", "rumah", "Tembung Aran", "Dalemipun wonten ing Sala."),
]


def seed_aksara(db) -> tuple[int, int]:
    existing = set(db.scalars(select(AksaraJawa.nama)).all())
    added = 0
    for latin, karakter in CARAKAN.items():
        if latin in existing:
            continue
        db.add(
            AksaraJawa(
                karakter=karakter,
                nama=latin,
                jenis="carakan",
                latin_equivalent=latin,
            )
        )
        added += 1
    return added, len(existing)


def seed_kawruh(db) -> tuple[int, int]:
    existing = set(db.scalars(select(KawruhBasa.ngoko)).all())
    added = 0
    for ngoko, krama_lugu, krama_inggil, indonesia, kelas, ukara in KAWURUH_DATA:
        if ngoko in existing:
            continue
        db.add(
            KawruhBasa(
                ngoko=ngoko,
                krama_lugu=krama_lugu,
                krama_inggil=krama_inggil,
                bahasa_indonesia=indonesia,
                kelas_kata=kelas,
                contoh_ukara=ukara,
            )
        )
        added += 1
    return added, len(existing)


def seed_paribasan(db) -> tuple[int, int]:
    existing = set(db.scalars(select(Paribasan.teks)).all())
    added = 0
    for teks, tegese, kategori, padanan in PARIBASAN_DATA:
        if teks in existing:
            continue
        db.add(
            Paribasan(
                teks=teks,
                tegese=tegese,
                kategori=kategori,
                padanan_indonesia=padanan,
            )
        )
        added += 1
    return added, len(existing)


def seed_macapat(db) -> tuple[int, int]:
    existing = set(db.scalars(select(Macapat.nama_tembang)).all())
    added = 0
    for key, item in PAUGERAN.items():
        name = key.title()
        if name in existing:
            continue
        rules = [
            {"gatra": index, "wilangan": wilangan, "lagu": lagu}
            for index, (wilangan, lagu) in enumerate(item["paugeran"], start=1)
        ]
        db.add(
            Macapat(
                nama_tembang=name,
                paugeran_gatra=item["gatra"],
                paugeran_wilangan_lagu=rules,
                watak=item["watak"],
            )
        )
        added += 1
    return added, len(existing)


def seed_admin_user(db) -> tuple[int, int]:
    """Seed default admin account if none exists."""
    existing = db.scalar(select(AdminUser.username).where(AdminUser.username == DEFAULT_ADMIN_USERNAME))
    if existing:
        return 0, 1
    db.add(
        AdminUser(
            username=DEFAULT_ADMIN_USERNAME,
            password_hash=get_password_hash(DEFAULT_ADMIN_PASSWORD),
            role=AdminRole.ADMIN,
            is_active=True,
        )
    )
    return 1, 0


def seed() -> None:
    with SessionLocal.begin() as db:
        results = {
            "aksara_jawa": seed_aksara(db),
            "kawruh_basa": seed_kawruh(db),
            "paribasan": seed_paribasan(db),
            "macapat": seed_macapat(db),
            "admin_user": seed_admin_user(db),
        }
    for table, (added, existing) in results.items():
        print(f"{table}: {added} added, {existing} already present")


if __name__ == "__main__":
    seed()
