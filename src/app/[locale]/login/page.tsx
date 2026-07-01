import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
