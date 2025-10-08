import { LoginForm } from '@/app/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
