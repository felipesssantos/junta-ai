'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { PlusCircle, Wallet, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
  total_goal_amount: number
  category: string
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [showModal, setShowModal] = useState(false) // Controle do Modal
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupGoal, setNewGroupGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const { data } = await supabase.from('groups').select('*')
    if (data) setGroups(data)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cria o grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: newGroupName,
          total_goal_amount: parseFloat(newGroupGoal),
          owner_id: user.id,
          category: 'geral'
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // 2. Adiciona o dono como membro automaticamente
      if (groupData) {
        await supabase
          .from('group_members')
          .insert([{
            group_id: groupData.id,
            user_id: user.id,
            role: 'admin',
            individual_goal: 0 
          }])
        
        // Atualiza a lista e fecha o modal
        await fetchGroups()
        setShowModal(false)
        setNewGroupName('')
        setNewGroupGoal('')
      }
    } catch (error: any) {
      alert('Erro ao criar grupo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Grupos</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition shadow-lg"
        >
          <PlusCircle size={24} />
        </button>
      </header>

      {/* Lista de Grupos */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <Link href={`/group/${group.id}`} key={group.id}>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">
                    {group.category || 'Geral'}
                  </span>
                  <h2 className="text-xl font-bold mt-2 text-gray-800">{group.name}</h2>
                </div>
                <Wallet className="text-gray-400" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Meta</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {group.total_goal_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Link>
        ))}
        
        {groups.length === 0 && (
          <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
            <Wallet size={48} className="text-gray-300 mb-4" />
            <p>Você não tem grupos.</p>
            <p className="text-sm">Clique no + para criar o primeiro!</p>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Novo Grupo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome do Grupo</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  placeholder="Ex: Churrasco da Firma"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Meta Total (R$)</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  placeholder="1000.00"
                  value={newGroupGoal}
                  onChange={e => setNewGroupGoal(e.target.value)}
                  required
                />
              </div>

              <button 
                disabled={loading}
                className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading ? 'Criando...' : 'Criar Grupo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
