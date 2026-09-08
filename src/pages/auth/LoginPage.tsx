import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Lock, User } from 'lucide-react'
import { authService } from '@/api/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Footer } from '@/components/layout/Footer'
import { getErrorMessage } from '@/api/client'

const schema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean(),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const token           = useAuthStore((s) => s.token)
  const role            = useAuthStore((s) => s.role)
  const setAuth         = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: localStorage.getItem('perpustakaan_remembered_email') ?? '',
      password: '',
      remember: true,
    },
  })

  // Jika sudah terautentikasi, langsung redirect ke dashboard yang sesuai
  useEffect(() => {
    if (isAuthenticated && token) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else navigate('/staff/dashboard', { replace: true })
    }
  }, [isAuthenticated, token, role, navigate])

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authService.login(data),
    onSuccess: ({ user, token }, variables) => {
      const userRole = (user as unknown as { role?: string }).role ?? 'petugas'

      if (variables.remember) {
        localStorage.setItem('perpustakaan_remembered_email', variables.email)
      } else {
        localStorage.removeItem('perpustakaan_remembered_email')
      }

      setAuth(user, token, userRole, variables.remember)

      if (userRole === 'admin') navigate('/admin/dashboard', { replace: true })
      else navigate('/staff/dashboard', { replace: true })
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
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer accent-primary-600"
                />
                <span className="text-sm text-slate-600 font-medium">Ingat saya</span>
              </label>
            </div>
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
