import { LoginForm } from "@/features/auth/components/loginForm";

export function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gray-900">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
