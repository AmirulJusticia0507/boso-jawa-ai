import { Component, type ErrorInfo, type ReactNode } from "react";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render error", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6 text-center text-ink-900 dark:bg-sogan-950 dark:text-cream-100">
          <div>
            <p className="font-jawa text-4xl text-prada-500">ꦲꦺꦴꦫꦲꦶꦱ</p>
            <h1 className="mt-3 font-display text-3xl font-bold">Aplikasi nemoni masalah</h1>
            <p className="mt-2">Monggo muat ulang kaca iki. Yen masalah terus muncul, coba maneh mengko.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-sogan-800 px-5 py-2 font-semibold text-cream-50 dark:bg-prada-500 dark:text-sogan-950">Muat ulang</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
