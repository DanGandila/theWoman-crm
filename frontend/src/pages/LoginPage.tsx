import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { apiErrorMessage } from '@/lib/utils';
import { FormField, inputClass } from '@/components/ui/form-field';
import Button from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate('/projects');
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card border rounded-xl shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">theWoman CRM</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@thewoman.ro"
              className={inputClass}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
