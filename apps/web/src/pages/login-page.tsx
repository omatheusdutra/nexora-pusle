import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../auth/auth-context";

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? "/dashboard";
  }, [location.state]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Credenciais inválidas. Confira os dados e tente novamente.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(80, 230, 190, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(80, 230, 190, 0.09) 1px, transparent 1px), radial-gradient(circle at 25% 18%, rgba(35, 124, 255, 0.24), transparent 32%), radial-gradient(circle at 82% 70%, rgba(16, 185, 129, 0.18), transparent 30%)",
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%"
        }}
      />
      <section className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-8">
        <div className="hidden max-w-2xl lg:block">
          <BrandMark />
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sessão segura via cookie HttpOnly
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-normal">
            Entrar na Nexora Pulse
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Acesse o centro inteligente de operações para acompanhar filas,
            atendentes, qualidade e relatórios em tempo real.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[430px] rounded-lg border border-white/12 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="mt-6 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Nexora Secure Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              Entrar na Nexora Pulse
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Acesse o centro inteligente de operações.
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-200">E-mail</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-11 border-white/12 bg-black/20 pl-10 text-white placeholder:text-slate-500"
                  value={email}
                  type="email"
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@nexora.local"
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-200">Senha</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-11 border-white/12 bg-black/20 pl-10 text-white placeholder:text-slate-500"
                  value={password}
                  type="password"
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                />
              </span>
            </label>

            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <Button
              className="h-11 w-full justify-center gap-2"
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Entrando..." : "Entrar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-white/10 bg-black/20 px-3 py-2.5 text-xs leading-5 text-slate-300">
            Acesso restrito a usuários operacionais autorizados.
          </div>
        </div>
      </section>
    </main>
  );
}
