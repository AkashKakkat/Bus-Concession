import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,86,211,0.28),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,140,66,0.18),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-panel backdrop-blur">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="hidden bg-slate-900/60 p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="space-y-6">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Bus Concession System
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-md text-4xl font-semibold leading-tight">
                    Role-based access for students and conductors in one clean frontend.
                  </h1>
                  <p className="max-w-md text-sm leading-7 text-slate-300">
                    Students can log in and manage their route and pass flow. Conductors can
                    log in separately and verify live passes from the conductor panel.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Quick access</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Choose the role below to continue to the correct authentication flow.
                </p>
              </div>
            </section>

            <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
              <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
                    Welcome
                  </p>
                  <h2 className="text-3xl font-semibold text-slate-900">Choose your portal</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Continue as a student or a conductor.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
                    to="/login"
                  >
                    Student Login
                  </Link>

                  <Link
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    to="/conductor-login"
                  >
                    Conductor Login
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
