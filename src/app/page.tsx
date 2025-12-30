'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Wallet, ArrowRight, Loader2 } from 'lucide-react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Para testar rápido, use o login com magic link
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      alert('Verifique seu e-mail para o link de login!')
    }
    setLoading(false)
  }

  // Atalho para quem já está logado
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) router.push('/dashboard')
  }
  checkUser()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 z-10 flex flex-col items-center">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
          <Wallet size={40} className="text-white" />
        </div>

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          JuntaAí
        </h1>

        <p className="mb-8 text-slate-400 text-center text-lg">
          Gerencie a vaquinha da galera <br /> sem estresse.
        </p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="email"
              placeholder="seu@email.com"
              className="glass-input w-full p-4 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            className="btn-primary w-full p-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Entrar com Magic Link
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Não precisa de senha, apenas seu e-mail.</p>
        </div>
      </div>
    </div>
  )
}
