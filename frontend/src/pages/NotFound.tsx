import { Link } from "react-router-dom";
import { PageHeader, buttonCls, cardCls } from "../components/ui";

export default function NotFound() {
  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦲꦺꦴꦫꦏꦼꦠꦼꦩꦸ" title="404 — Kaca Ora Ketemu" desc="Alamat sing sampeyan bukak ora ana utawa wis dipindhah." />
      <div className={`${cardCls} text-center`}>
        <p>Priksa maneh alamat kaca utawa bali menyang beranda.</p>
        <Link to="/" className={`${buttonCls} mt-4 inline-block`}>Bali menyang Beranda</Link>
      </div>
    </section>
  );
}
