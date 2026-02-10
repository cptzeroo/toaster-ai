import { RegisterForm } from "@/features/auth/components/registerForm";

export function RegisterPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gray-900">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
