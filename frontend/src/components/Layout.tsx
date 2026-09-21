import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <h1>ꦧꦱꦗꦮ AI</h1>
        <nav className="nav">
          <NavLink to="/" end>
            Beranda
          </NavLink>
          <NavLink to="/aksara">Aksara</NavLink>
          <NavLink to="/kawruh">Kawruh</NavLink>
          <NavLink to="/macapat">Macapat</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        Boso Jawa AI — pelestarian basa lan sastra Jawa secara digital.
      </footer>
    </div>
  );
}
