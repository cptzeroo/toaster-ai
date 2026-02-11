import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import { VALIDATION } from "@/features/auth/constants/validation";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < VALIDATION.USERNAME.MIN_LENGTH) {
      setError(VALIDATION.USERNAME.MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setError(VALIDATION.PASSWORD_CONFIRM.MESSAGE);
      return;
    }

    if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
      setError(VALIDATION.PASSWORD.MESSAGE);
      return;
    }

    setIsLoading(true);

    try {
      await register(username, password, name || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Toaster"
          src="/assets/icons/toaster.png"
          className="mx-auto h-20 w-auto"
        />
        <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
      </div>

      {/* Form */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name (optional)
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-md bg-input px-3 py-2 text-base text-foreground outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-md bg-input px-3 py-2 text-base text-foreground outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-md bg-input px-3 py-2 text-base text-foreground outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-md bg-input px-3 py-2 text-base text-foreground outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
