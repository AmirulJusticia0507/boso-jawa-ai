"""Seed data paribasan, bebasan, lan saloka.

Cara pakai (dari direktori backend/):
    python seed_paribasan.py

Script aman dijalankan berulang — mung nambahake entri kang durung ana
(dicek adhedhasar kolom ``teks``), dadi ora nggawe data ganda.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select  # noqa: E402

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
    # === Paribasan: hubungan sosial, kerja sama, lan nasihat ===
    (
        "Ana catur mungkur",
        "Ora gelem ngrungokake rerasan ala utawa gunjingan wong liya.",
        "paribasan",
        "Tidak mau mendengarkan gunjingan orang lain.",
    ),
    (
        "Anak polah bapa kepradhah",
        "Tingkah polahe anak dadi tanggung jawabe wong tuwa.",
        "paribasan",
        "Tingkah anak menjadi tanggung jawab orang tua.",
    ),
    (
        "Crah agawe bubrah, rukun agawe santosa",
        "Padudon nggawe bubrah, dene rukun nggawe kuwat lan tentrem.",
        "paribasan",
        "Perselisihan membuat rusak, kerukunan membuat sentosa.",
    ),
    (
        "Desa mawa cara, negara mawa tata",
        "Saben dhaerah utawa papan duwe adat lan tata cara dhewe-dhewe.",
        "paribasan",
        "Lain ladang lain belalang, lain lubuk lain ikannya; setiap tempat punya adat sendiri.",
    ),
    (
        "Entheng padha dijinjing, abot padha dipikul",
        "Pagawean utawa rekasa dienthengake bebarengan kanthi gotong royong.",
        "paribasan",
        "Ringan sama dijinjing, berat sama dipikul.",
    ),
    (
        "Tuna satak bathi sanak",
        "Rugi sethithik ora dadi masalah yen entuk sedulur utawa kanca.",
        "paribasan",
        "Rugi sedikit asal mendapat saudara.",
    ),
    (
        "Wani ngalah luhur wekasane",
        "Wong kang gelem ngalah bakal luhur lan begja wekasane.",
        "paribasan",
        "Berani mengalah akan berakhir mulia.",
    ),
    (
        "Aja dumeh",
        "Aja sombong utawa ngendel-endelake kaluwihan sing diduweni.",
        "paribasan",
        "Jangan sombong karena kelebihan yang dimiliki.",
    ),
    (
        "Aja gumunan, aja kagetan, aja dumeh",
        "Aja gampang gumun, gampang kaget, lan aja sombong.",
        "paribasan",
        "Jangan mudah kagum, mudah kaget, dan jangan sombong.",
    ),
    (
        "Aja rumangsa bisa, nanging bisaa rumangsa",
        "Aja rumangsa pinter, nanging kudu bisa ngerti dhiri.",
        "paribasan",
        "Jangan merasa bisa, tetapi bisalah merasa; jangan sombong.",
    ),
    (
        "Aja mung waton ngomong, nanging ngomonga nganggo waton",
        "Aja ngomong tanpa dhasar, ngomonga nganggo alesan kang cetha.",
        "paribasan",
        "Jangan asal bicara, bicaralah dengan alasan yang jelas.",
    ),
    (
        "Aja keminter mundhak keblinger, aja cidra mundhak cilaka",
        "Aja sok pinter lan aja tumindak cidra supaya ora nemu cilaka.",
        "paribasan",
        "Jangan sok pintar dan jangan berbuat curang agar tidak celaka.",
    ),
    (
        "Ajining diri saka lathi, ajining raga saka busana",
        "Kehormatan diri katon saka omongane, kehormatan raga saka busanane.",
        "paribasan",
        "Kehormatan diri dari lisan, kehormatan raga dari pakaian.",
    ),
    (
        "Sing eling lan waspada",
        "Kudu tansah eling marang Gusti lan waspada marang kahanan.",
        "paribasan",
        "Selalu ingat dan waspada.",
    ),
    (
        "Tut wuri handayani",
        "Saka mburi menehi dorongan lan tuntunan marang sing luwih enom.",
        "paribasan",
        "Dari belakang memberi dorongan (semboyan pendidikan).",
    ),
    (
        "Urip iku urup",
        "Urip kudu bisa dadi pepadhang lan migunani marang liyan.",
        "paribasan",
        "Hidup itu nyala; hidup harus memberi manfaat bagi sesama.",
    ),
    (
        "Angon mangsa",
        "Nggoleki wektu lan kahanan sing trep kanggo tumindak.",
        "paribasan",
        "Mencari waktu yang tepat untuk bertindak.",
    ),
    # === Paribasan: sifat manusia (sombong, rendah hati, sabar) ===
    (
        "Kumenthus ora pecus",
        "Ketoke pinter lan mumpuni, nanging satemene ora ngerti apa-apa.",
        "paribasan",
        "Sok tahu dan berlagak pintar padahal tidak paham.",
    ),
    (
        "Sugih pari angawak-awakake",
        "Sombong amarga rumangsa bisa nguwasani basa utawa kawruh.",
        "paribasan",
        "Sombong karena merasa menguasai bahasa atau ilmu.",
    ),
    (
        "Rai gedheg",
        "Ora duwe isin sanajan wis jelas tumindake salah.",
        "paribasan",
        "Tidak tahu malu.",
    ),
    (
        "Kekudhung walulang macan",
        "Nggunakake pengaruhe wong kang diajeni utawa ditakuti kanggo gegayuhan.",
        "paribasan",
        "Berlindung di balik pengaruh orang yang ditakuti.",
    ),
    (
        "Kadang konang",
        "Ngaku sedulur mung yen ana sing sugih utawa duwe bandha.",
        "paribasan",
        "Mengaku saudara hanya saat ada harta.",
    ),
    (
        "Asu gedhe menang kerahe",
        "Sing kuwat utawa panguwasa biasane sing menang.",
        "paribasan",
        "Yang besar dan berkuasa biasanya menang.",
    ),
    (
        "Mendhak-mendhak kaya liwet",
        "Wong kang pangkate utawa drajate saya mudhun.",
        "paribasan",
        "Kedudukan yang semakin menurun.",
    ),
    (
        "Wedi rai wani silit",
        "Wedi yen ngarep, nanging wani yen mburi (ora tanggung jawab).",
        "paribasan",
        "Takut di depan, berani di belakang.",
    ),
    (
        "Wedi ing wayangane dhewe",
        "Wong kang duwe salah dadi wedi marang wayangane dhewe.",
        "paribasan",
        "Takut akan bayangannya sendiri.",
    ),
    (
        "Bapa kesulah anak kepolah",
        "Wong tuwa dihukum, anak melu ngrasakake akibate.",
        "paribasan",
        "Orang tua dihukum, anak ikut menanggung.",
    ),
    (
        "Kaduk wani kurang deduga",
        "Kakehan wani nanging kurang tetimbangan.",
        "paribasan",
        "Kelebihan berani kurang pertimbangan.",
    ),
    (
        "Ancik-ancik pucuking eri",
        "Manggon ing kahanan kang mbebayani, mung sithik keslametane.",
        "paribasan",
        "Berada di tempat yang berbahaya.",
    ),
    (
        "Nguthik-uthik macan dhedhe",
        "Nggugah masalah utawa prakara kang mbebayani.",
        "paribasan",
        "Membangkitkan masalah yang berbahaya.",
    ),
    (
        "Nabok nyilih tangan",
        "Nindakake tumindak ala kanthi nyilih tangan wong liya.",
        "paribasan",
        "Berbuat jahat lewat tangan orang lain.",
    ),
    (
        "Mbuwang tilas",
        "Ethok-ethok ora ngerti marang tumindak ala sing wis dilakoni.",
        "paribasan",
        "Pura-pura tidak tahu perbuatan buruknya.",
    ),
    (
        "Legan golek momongan",
        "Wong kang uripe kepenak malah golek pagawean kang angel.",
        "paribasan",
        "Yang hidup enak malah mencari pekerjaan yang sulit.",
    ),
    (
        "Ketula-tula ketali",
        "Wong kang uripe rekasa banget lan tansah nemu alangan.",
        "paribasan",
        "Hidup melarat dan penuh penderitaan.",
    ),
    (
        "Ketepang ngrangsang gunung",
        "Wong cilik kang duwe gegayuhan kang mokal bisa kelakon.",
        "paribasan",
        "Orang kecil bercita-cita mustahil tercapai.",
    ),
    (
        "Cedhak kebo gupak",
        "Cedhak utawa kanca karo wong ala bakal ketularan ala.",
        "paribasan",
        "Dekat dengan orang jahat akan tertular.",
    ),
    (
        "Ciri wanci lelai ginawa mati",
        "Watak utawa kebiasaan ala ora bakal ilang nganti mati.",
        "paribasan",
        "Kebiasaan buruk tidak hilang sampai mati.",
    ),
    (
        "Dhemit ora ndulit, setan ora doyan",
        "Donga lan pangarep-arep supaya tansah slamet tanpa alangan.",
        "paribasan",
        "Doa agar selalu diberi keselamatan tanpa halangan.",
    ),
    # === Paribasan: rejeki, usaha, waktu, lan kesempatan ===
    (
        "Jer basuki mawa beya",
        "Saben gegayuhan utawa cita-cita mbutuhake ragat utawa biaya.",
        "paribasan",
        "Setiap cita-cita memerlukan biaya.",
    ),
    (
        "Sapa temen bakal tinemu",
        "Sapa sing temen lan sregep bakal kasembadan gegayuhane.",
        "paribasan",
        "Yang bersungguh-sungguh akan berhasil.",
    ),
    (
        "Sapa nandur bakal ngundhuh",
        "Sapa sing tumindak becik utawa ala bakal ngundhuh wohe.",
        "paribasan",
        "Siapa menanam akan menuai.",
    ),
    (
        "Sapa salah bakal seleh",
        "Wong kang tumindak salah mesthi bakal konangan lan kalah.",
        "paribasan",
        "Yang bersalah pasti akan ketahuan.",
    ),
    (
        "Ngelmu iku kelakone kanthi laku",
        "Ngelmu utawa kawruh bisane kelakon yen dilakoni kanthi temen.",
        "paribasan",
        "Ilmu diraih dengan diamalkan.",
    ),
    (
        "Semut marani gula",
        "Wong-wong padha marani papan kang ana untunge.",
        "paribasan",
        "Seperti semut mendatangi gula; datang karena ada keuntungan.",
    ),
    (
        "Gabah sinawur",
        "Wong kang ora duwe panggonan utawa pangkate tetep.",
        "paribasan",
        "Orang yang tidak punya tempat tinggal tetap.",
    ),
    (
        "Kalah cacak menang cacak",
        "Prakara kang durung cetha kudu dicoba dhisik supaya ngerti kasile.",
        "paribasan",
        "Kalah menang dicoba dulu; mencoba sebelum tahu hasilnya.",
    ),
    (
        "Melok nanging aja nyolok",
        "Olehe melu utawa tumindak aja nganti keliwat-liwat.",
        "paribasan",
        "Ikut boleh asal jangan berlebihan.",
    ),
    (
        "Walik gereh",
        "Nggarap pagawean kanthi genti-genti utawa giliran.",
        "paribasan",
        "Mengerjakan pekerjaan secara bergantian.",
    ),
    (
        "Pathok bangkrong",
        "Panawaran rega kang tetep ora bisa ditawa maneh.",
        "paribasan",
        "Tawaran dengan harga tetap.",
    ),
    (
        "Amek iwak aja nganti buthek banyune",
        "Ngrampungake prakara aja nganti nuwuhake prakara anyar.",
        "paribasan",
        "Menyelesaikan masalah tanpa menimbulkan masalah baru.",
    ),
    (
        "Dhalang karubuhan panggung",
        "Omongane wong kang kaceluk utawa kacelakake dening wong liya.",
        "paribasan",
        "Pembicaraan terhenti karena disela orang lain.",
    ),
    (
        "Mantra kacuta",
        "Nemu kawirangan utawa isin amarga kaluputane dhewe.",
        "paribasan",
        "Mendapat malu.",
    ),
    (
        "Yumana mati lena",
        "Nemu kacilakan amarga kurang ngati-ati.",
        "paribasan",
        "Mendapat kecelakaan karena kurang hati-hati.",
    ),
    (
        "Kakehan gludug kurang udan",
        "Akeh omongane nanging ora ana bukti utawa nyatane.",
        "paribasan",
        "Banyak bicara tapi tidak ada buktinya.",
    ),
    (
        "Maju tatu mundur ajur",
        "Maju utawa mundur padha-padha nemu bebaya; serba salah.",
        "paribasan",
        "Maju atau mundur sama-sama berbahaya.",
    ),
    (
        "Njajah desa milang kori",
        "Lelungan adoh tekan ngendi-endi panggonan.",
        "paribasan",
        "Menjelajah ke pelosok negeri.",
    ),
    (
        "Rawe-rawe rantas, malang-malang putung",
        "Samubarang alangan kudu disingkirake supaya gegayuhan kelakon.",
        "paribasan",
        "Menghalau segala rintangan yang menghadang.",
    ),
    (
        "Sadumuk bathuk sanyari bumi ditohi pati",
        "Perkara kehormatan utawa hak, senajan cilik, bisa ditohi nganti mati.",
        "paribasan",
        "Membela kehormatan sampai titik darah penghabisan.",
    ),
    (
        "Ngono ya ngono, nanging aja ngono",
        "Nasihat supaya tumindak aja nganti keliwat-liwat.",
        "paribasan",
        "Begitu boleh, tapi jangan keterlaluan.",
    ),
    (
        "Menang tanpa ngasorake",
        "Menang ora kudu ngasorake utawa ngrusak wong liya.",
        "paribasan",
        "Menang tanpa merendahkan orang lain.",
    ),
    # === Paribasan: padanan peribahasa Indonesia ===
    (
        "Ana dhuwit ana barang",
        "Yen ana dhuwit, barang apa wae bisa tinuku.",
        "paribasan",
        "Ada uang ada barang.",
    ),
    (
        "Menang dadi areng, kalah dadi awu",
        "Menang utawa kalah padha-padha nemu rugi utawa cilaka.",
        "paribasan",
        "Menang jadi arang, kalah jadi abu; serba rugi.",
    ),
    (
        "Sega wis dadi bubur",
        "Prakara kang wis kebacut ora bisa dibaleni maneh.",
        "paribasan",
        "Nasi sudah menjadi bubur; sudah terlanjur.",
    ),
    (
        "Nyawisake payung sadurunge udan",
        "Sadurunge nemu alangan, luwih becik nyawisake bekal lan pangaman.",
        "paribasan",
        "Sedia payung sebelum hujan.",
    ),
    (
        "Tong kosong nyaring bunyine",
        "Wong kang akeh omongane nanging sithik kawruhe.",
        "paribasan",
        "Tong kosong nyaring bunyinya.",
    ),
    (
        "Sawise peteng ana padhang",
        "Saben rekasa lan kesusahan mesthi ana wektu kepenak sawise.",
        "paribasan",
        "Habis gelap terbitlah terang.",
    ),
    # === Bebasan tambahan ===
    (
        "Abang lambe",
        "Omongane mung ing lambe wae, ora ditindakake kanthi tenanan.",
        "bebasan",
        "Hanya di bibir saja; bicara tanpa bukti.",
    ),
    (
        "Diwenehi ati ngrogoh rempela",
        "Wis diparingi barang kang becik malah njaluk kang luwih becik maneh.",
        "bebasan",
        "Dikasih makan minta lada; diberi enak malah minta lebih.",
    ),
    (
        "Wis kebak sundukane",
        "Wis akeh banget kaluputan utawa kesalahane.",
        "bebasan",
        "Sudah penuh kesalahannya.",
    ),
    (
        "Kembang lambe",
        "Dadi bahan rerasan utawa gunjingan wong akeh.",
        "bebasan",
        "Menjadi bahan pembicaraan orang banyak.",
    ),
    (
        "Nggendhong lali",
        "Lali marang kabeh amarga kepencut ing rasa seneng.",
        "bebasan",
        "Lupa diri karena terlalu senang.",
    ),
    # === Saloka tambahan ===
    (
        "Kaya banyu ing godhong keladi",
        "Omongane wong kang ora kena diugemi amarga gampang owah gingsir.",
        "saloka",
        "Bagai air di daun keladi; ucapannya tidak bisa dipegang.",
    ),
    (
        "Kaya mangan woh simalakama",
        "Kahanan serba salah; ditindakake salah, ora ditindakake ya salah.",
        "saloka",
        "Bagai makan buah simalakama; serba salah.",
    ),
    (
        "Manuk mabur dipipisake lada",
        "Wong kang wis lunga utawa ora ana, isih ditudhuh utawa dikarepake.",
        "saloka",
        "Burung terbang dipipiskan lada.",
    ),
    (
        "Kaya jamur ing mangsa udan",
        "Barang utawa prakara kang cepet tuwuh lan tambah akeh banget.",
        "saloka",
        "Seperti jamur di musim hujan; cepat berkembang.",
    ),
    (
        "Kaya macan luwe",
        "Wong kang katon nggegirisi lan mbebayani tumindake.",
        "saloka",
        "Seperti harimau lapar; menakutkan dan berbahaya.",
    ),
]


def seed() -> None:
    Base.metadata.create_all(engine)  # pastikan tabel ada
    db = SessionLocal()
    try:
        existing = set(db.scalars(select(Paribasan.teks)).all())
        added = 0
        for teks, tegese, kategori, padanan in DATA:
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
            existing.add(teks)
            added += 1
        db.commit()
        print(f"Berhasil nambah {added} paribasan (total data: {len(DATA)}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
