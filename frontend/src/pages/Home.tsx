import { Link } from "react-router-dom";

const MODULES = [
  {
    to: "/aksara",
    title: "Engine Transliterasi Aksara Jawa",
    desc: "Latin ↔ Aksara: pasangan, taling-tarung, panyigeg otomatis.",
  },
  {
    to: "/kawruh",
    title: "Kawruh Pepak & Undha-Usuk",
    desc: "Kamus Ngoko – Krama Lugu – Krama Inggil – Indonesia.",
  },
  {
    to: "/macapat",
    title: "Checker Tembang Macapat",
    desc: "Validasi guru gatra, wilangan, dan lagu 11 tembang.",
  },
];

export default function Home() {
  return (
    <section>
      <h2>Sugeng rawuh ing Boso Jawa AI</h2>
      <p>
        Sistem AI kebahasaan Jawa terpadu: transliterasi aksara, kamus
        undha-usuk, lan validator tembang macapat.
      </p>
      <div className="cards">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="card">
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
