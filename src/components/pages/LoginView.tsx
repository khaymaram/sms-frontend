import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../lib/axios";
import { Button } from "../ui/Button";
import Input from "../ui/Input";
import logo from "../../assets/logo.png";

const messages = ["Good to see you again.", "Welcome back.", "Ready for another great day?", "Your campus is waiting."];
const homeFor = (role: string) => role === "student" ? "/my-courses" : role === "professor" ? "/professor-dashboard" : "/dashboard";

export default function LoginView() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState(""); const [pending, setPending] = useState(false);
  const message = useMemo(() => messages[Math.floor(Math.random() * messages.length)], []);
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try { const account = await login(identifier, password); navigate(homeFor(account.role), { replace: true }); }
    catch (error) { toast.error(apiErrorMessage(error)); }
    finally { setPending(false); }
  }

  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="flex items-center justify-center bg-[#080d1a] p-10 text-white">
      <div className="text-center"><img src={logo} alt="GRGI University" className="mx-auto mb-6 size-28 object-contain" /><h1 className="font-heading text-4xl font-bold">GRGI University</h1><p className="mt-3 text-slate-300">Student Management System</p></div>
    </section>
    <section className="flex items-center justify-center bg-background p-6 sm:p-12">
      <div className="w-full max-w-md"><p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#1D4ED8]">Sign in</p><h2 className="text-3xl font-bold">{message}</h2><p className="mb-8 mt-2 text-muted-foreground">Enter your university ID and password.</p>
        <form className="space-y-5" onSubmit={submit}><Input label="University ID" placeholder="Student, professor, or admin ID" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required /><Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button className="w-full" type="submit" disabled={pending}><LogIn />{pending ? "Signing in..." : "Sign in"}</Button></form>
      </div>
    </section>
  </main>;
}
