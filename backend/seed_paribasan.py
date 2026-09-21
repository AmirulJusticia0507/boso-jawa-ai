"""Seed data paribasan, bebasan, lan saloka.

Cara pakai (dari direktori backend/):
    python seed_paribasan.py

Script aman dijalankan berulang — hanya mengisi bila tabel kosong.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.models.paribasan import Paribasan  # noqa: E402

DATA: list[tuple[str, str, str, str | None]] = [
    # (teks, tegese, kategori, padanan_indonesia)
    (
        "Adigang, adigung, adiguna",
        "Wong kang kuwat, duwe pangkat, lan pinter aja nganti sombong marang wong liya.",
        "paribasan",
        "Jangan menyombongkan kekuatan, kekuasaan, dan kepandaian.",
    ),
    (
        "Alon-alon waton kelakon",
        "Sabar lan tliti nanging tujuane kudu bisa kasil.",
        "paribasan",
        "Pelan-pelan asalkan tujuan tercapai.",
    ),
    (
        "Ana dina ana upa",
        "Saben wong urip mesthi nduweni rejeki dhewe-dhewe.",
        "paribasan",
        "Selama masih hidup pasti ada rezeki.",
    ),
    (
        "Becik ketitik ala ketara",
        "Tumindak becik lan ala sesuk mesthi bakal ketara utawa dibales.",
        "paribasan",
        "Perbuatan baik maupun buruk pasti terlihat balasannya.",
    ),
    (
        "Mikul dhuwur mendhem jero",
        "Tansah ngluhurake lan nyimpen wadi rahasia alane wong tuwa.",
        "paribasan",
        "Menjunjung tinggi nama baik dan menyimpan kejelekan orang tua.",
    ),
    (
        "Rame ing gawe sepi ing pamrih",
        "Nyambut gawe kanthi tenanan tanpa ngarep-arep pamrih.",
        "paribasan",
        "Bekerja keras dengan ikhlas tanpa mengharap imbalan.",
    ),
    (
        "Rebut balung tanpa isi",
        "Wong-wong pada rebutan barang sing ora ana gunane.",
        "paribasan",
        "Berebut sesuatu yang tidak ada manfaatnya.",
    ),
    (
        "Mburu uceng kelangan deleg",
        "Mburu barang cilik malah kelangan barang kang luwih gedhe.",
        "paribasan",
        "Mengejar yang kecil malah kehilangan yang besar.",
    ),
    (
        "Nguyahi segara",
        "Nambahan barang sing wis akeh/kakehan.",
        "paribasan",
        "Menuang garam ke laut; menambah sesuatu yang sudah banyak.",
    ),
    (
        "Emban cindhe emban siladan",
        "Wong tuwa luwih seneng lan ngemong marang anak kang luwih enom.",
        "paribasan",
        "Orang tua lebih menyayangi anak yang lebih muda.",
    ),
    (
        "Emban papan",
        "Bisa ngerti papan lan wektu sing trep kanggo tumindak.",
        "paribasan",
        "Tahu tempat dan waktu yang tepat (tahu diri).",
    ),
    (
        "Aji mumpung",
        "Ngragati wektu lan kahanan pas kanggo entuk keuntungan.",
        "paribasan",
        "Memanfaatkan kesempatan yang ada (mumpung).",
    ),
    (
        "Angon ulat",
        "Ngati-ati lan ngawasi tingkah laku wong liya.",
        "paribasan",
        "Jeli mengamati keadaan sekitar.",
    ),
    (
        "Kurang ajar",
        "Nduweni tindak tanduk sing ora sopan marang wong liya.",
        "paribasan",
        "Kurang ajar; tidak tahu sopan santun.",
    ),
    (
        "Ngluruk tan baya",
        "Tumindak kanthi yakin ora ana alangan.",
        "paribasan",
        "Berani maju tanpa takut halangan.",
    ),
    (
        "Suba sita",
        "Sopan santun lan budi pekerti kang becik.",
        "paribasan",
        "Sopan santun dan budi pekerti yang luhur.",
    ),
    (
        "Kebat kliwat",
        "Kesusu banget nganti tumindake ora becik utawa malah kelangan.",
        "paribasan",
        "Terlalu tergesa-gesa hingga terlewat.",
    ),
    (
        "Ora obah ora mamah",
        "Wong sing ora gelem nyambut gawe mesthi ora oleh rejeki.",
        "paribasan",
        "Tidak bergerak tidak makan; yang mau bekerja akan mendapat hasil.",
    ),
    (
        "Kebo nusu gudel",
        "Wong tuwa sing njaluk wuruk marang wong kang luwih enom.",
        "bebasan",
        "Orang tua yang belajar/meminta petunjuk pada orang yang lebih muda.",
    ),
    (
        "Gajah ngidak rapah",
        "Wong gedhe/panggedhe sing nglanggar ature dhewe.",
        "bebasan",
        "Pemimpin yang melanggar aturannya sendiri.",
    ),
    (
        "Cebol nggayuh lintang",
        "Wong sing karepe ngungkuli kekuwatane dhewe.",
        "bebasan",
        "Orang kecil hendak meraih bintang; cita-cita melebihi kemampuan.",
    ),
    (
        "Bebek mungsuh mliwis",
        "Wong sing padha-padha ngadu kuwat karo golongane dhewe.",
        "bebasan",
        "Beradu kekuatan antar sesama sendiri.",
    ),
    (
        "Asu belang kalung wang",
        "Wong asor nanging kelakon dadi sugih, ora padha karo asal-usule.",
        "bebasan",
        "Orang rendah yang jadi kaya, berbeda dari asal-usulnya.",
    ),
    (
        "Kethek sarang",
        "Wong sing ora ngajeni marang wong liya.",
        "bebasan",
        "Orang yang tidak menghormati orang lain.",
    ),
    (
        "Ngitik karo nginang",
        "Sekeleh ngerjakake barang loro sekaligus, sing siji karo sijine ora padha lan bisa ngrusak awakening.",
        "bebasan",
        "Mengerjakan dua hal sekaligus yang tidak seimbang; tidak fokus.",
    ),
    (
        "Kaya banyu karo lenga",
        "Wong loro sing ora bisa rukun.",
        "saloka",
        "Seperti air dan minyak; tidak bisa rukun.",
    ),
    (
        "Kaya cacing kepanasan",
        "Wong sing ora bisa anteng/tenang anggone lungguh.",
        "saloka",
        "Seperti cacing kepanasan; tidak bisa diam.",
    ),
    (
        "Kaya ketiban duren",
        "Oleh rejeki gedhe sing ora dikarepake.",
        "saloka",
        "Seperti tertimpa durian; mendapat rezeki besar tak terduga.",
    ),
    (
        "Kaya pinang dibelah loro",
        "Wong loro sing memungsuh nanging saiki rukun, utawa kahanan sing padha banget.",
        "saloka",
        "Seperti pinang dibelah dua; sangat mirip/sama.",
    ),
    (
        "Kaya kodhok kena upas",
        "Wong sing kena sial/bebaya gedhe.",
        "saloka",
        "Seperti katak kena racun; terkena bencana.",
    ),
    (
        "Kaya ngembang Bathok",
        "Ora cocok ora jumbuh (pangestu ora ana).",
        "saloka",
        "Tidak cocok; tidak sesuai harapan.",
    ),
]


def seed() -> None:
    Base.metadata.create_all(engine)  # pastikan tabel ada
    db = SessionLocal()
    try:
        existing = db.query(Paribasan).count()
        if existing > 0:
            print(f"Tabel paribasan wis ana {existing} baris — skip seeding.")
            return
        for teks, tegese, kategori, padanan in DATA:
            db.add(
                Paribasan(
                    teks=teks,
                    tegese=tegese,
                    kategori=kategori,
                    padanan_indonesia=padanan,
                )
            )
        db.commit()
        print(f"Berhasil nambah {len(DATA)} paribasan.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()