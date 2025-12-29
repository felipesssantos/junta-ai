'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-2 text-blue-500">JuntaAí 💰</h1>
      <p className="mb-8 text-gray-400">Gerencie a vaquinha da galera sem estresse.</p>
      
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="email"
          placeholder="Seu e-mail"
          className="p-3 rounded bg-gray-800 border border-gray-700 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Entrar com E-mail'}
        </button>
      </form>
    </div>
  )
}
