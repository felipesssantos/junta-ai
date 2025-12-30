'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { PlusCircle, Wallet, X, Store, Plane, Home, Users, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProfileModal from '../../components/ProfileModal'

interface Group {
  id: string
  name: string
  total_goal_amount: number
  category: string
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupGoal, setNewGroupGoal] = useState('')
  const [newPixKey, setNewPixKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    fetchUserAndGroups()
  }, [])

  const fetchUserAndGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/')

    setUserId(user.id)
    fetchGroups()
  }

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('group_members')
      .select('groups ( * )')
      .eq('user_id', user.id)

    if (data) {
      // Data vem no formato [{ groups: { ... } }, { groups: { ... } }]
      // Precisamos extrair o objeto groups
      const myGroups = data.map((item: any) => item.groups)
      setGroups(myGroups)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return router.push('/')
      }

      // 1. Cria o grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: newGroupName,
          total_goal_amount: parseFloat(newGroupGoal),
          owner_id: user.id,
          category: 'geral',
          pix_key: newPixKey // Salva a chave PIX
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // 2. Adiciona o dono como membro
      if (groupData) {
        await supabase
          .from('group_members')
          .insert([{
            group_id: groupData.id,
            user_id: user.id
            // role: 'admin' removido pois usamos owner_id na tabela groups
          }])

        await fetchGroups()
        setShowModal(false)
        setNewGroupName('')
        setNewGroupGoal('')
        setNewPixKey('')
      }
    } catch (error: any) {
      console.error(error)
      alert('Erro ao criar grupo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'viagem': return <Plane size={24} className="text-purple-400" />
      case 'casa': return <Home size={24} className="text-blue-400" />
      case 'compras': return <Store size={24} className="text-pink-400" />
      default: return <Wallet size={24} className="text-emerald-400" />
    }
  }

  return (
    <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
      {/* Modal de Perfil (só aparece se necessário) */}
      {userId && <ProfileModal userId={userId} onComplete={() => { }} />}

      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-8 sticky top-4 z-20 glass-panel p-4 rounded-2xl">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Meus Grupos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <PlusCircle size={24} />
        </button>
      </header>

      {/* Lista de Grupos */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <Link href={`/group/${group.id}`} key={group.id}>
            <div className="glass-panel p-5 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/80 transition group relative overflow-hidden border-transparent">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet size={100} />
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                    {getCategoryIcon(group.category)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {group.category || 'Geral'}
                    </span>
                    <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {group.name}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-end relative z-10">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Meta</p>
                  <p className="text-xl font-bold text-emerald-400">
                    R$ {group.total_goal_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {/* Badge de Pagamentos Pendentes (Futuro: Realizar count no DB) */}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {groups.length === 0 && (
          <div className="text-center text-slate-500 mt-20 flex flex-col items-center glass-panel p-8 rounded-3xl border-dashed border-2 border-slate-700">
            <div className="p-4 bg-slate-800 rounded-full mb-4">
              <Users size={32} className="text-slate-400" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Nenhum grupo ainda</p>
            <p className="text-sm">Crie uma vaquinha para começar!</p>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO DO GRUPO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Novo Grupo</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition bg-slate-800/50 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block uppercase tracking-wide">Nome do Grupo</label>
                <input
                  autoFocus
                  type="text"
                  className="glass-input w-full p-3 rounded-xl"
                  placeholder="Ex: Viagem Ano Novo"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block uppercase tracking-wide">Meta Total (R$)</label>
                <input
                  type="number"
                  className="glass-input w-full p-3 rounded-xl"
                  placeholder="1000.00"
                  value={newGroupGoal}
                  onChange={e => setNewGroupGoal(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block uppercase tracking-wide flex items-center gap-1">
                  <QrCode size={14} /> Chave PIX (Opcional)
                </label>
                <input
                  type="text"
                  className="glass-input w-full p-3 rounded-xl"
                  placeholder="Seu CPF, E-mail ou Telefone"
                  value={newPixKey}
                  onChange={e => setNewPixKey(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className="btn-primary py-3.5 rounded-xl mt-4 flex items-center justify-center font-bold"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Criar Grupo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Loader2({ size, className }: { size?: number, className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}
