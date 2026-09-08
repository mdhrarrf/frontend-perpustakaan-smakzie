import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { BookOpen, Lock, User } from 'lucide-react'
import { authService } from '@/api/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Footer } from '@/components/layout/Footer'
import { getErrorMessage } from '@/api/client'

const schema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate   = useNavigate()
  const setAuth    = useAuthStore((s) => s.setAuth)
  const setRole    = useAuthStore((s) => s.setRole)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authService.login(data),
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      // Tentukan role (akan diisi lebih lengkap setelah /auth/me)
      // Untuk sementara cek nama role dari response (backend harus menyertakan role)
      const role = (user as unknown as { role?: string }).role ?? 'petugas'
      setRole(role)

      if (role === 'admin') navigate('/admin/dashboard')
      else navigate('/staff/dashboard')
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex flex-col items-center justify-between p-4 sm:p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm py-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-smakzie.png" alt="Logo SMK Negeri 1 Cianjur" className="w-24 h-24 object-contain mb-4 drop-shadow-sm" />
          <h1 className="text-xl font-bold text-slate-900 text-center">Perpustakaan SMK Negeri 1 Cianjur</h1>
          <p className="text-sm text-slate-500">Masuk ke panel pengelolaan</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            <Input
              {...register('email', { required: true })}
              label="Email"
              type="email"
              placeholder="admin@smkn1cianjur.sch.id"
              leftIcon={<User size={16} />}
              error={errors.email?.message}
              required
              autoFocus
            />
            <Input
              {...register('password')}
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              required
            />
            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
            >
              Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Untuk akses kiosk,{' '}
          <a href="/kiosk" className="text-primary-500 hover:underline">klik di sini</a>
        </p>
      </div>

      <Footer variant="auth" />
    </div>
  )
}
