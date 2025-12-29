'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Share2, LogIn } from 'lucide-react'
import Link from 'next/link'

interface Member {
  user_id: string
  role: string
  profiles: {
    full_name: string
    avatar_url: string
  }
}

interface GroupDetails {
  id: string
  name: string
  total_goal_amount: number
  pix_key: string
  owner_id: string
}

export default function GroupDetails() {
  const params = useParams()
  const groupId = params.id as string
  
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (groupId) loadData()
  }, [groupId])

  const loadData = async () => {
    // 1. Pega usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    // 2. Pega dados do grupo
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    setGroup(groupData)

    // 3. Pega membros (agora buscando direto da tabela certa)
    const { data: membersData } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        profiles ( full_name, avatar_url )
      `)
      .eq('group_id', groupId)

    if (membersData) setMembers(membersData as any)
  }

  const handleJoinGroup = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id,
          role: 'member',
          individual_goal: 0
        }])
      
      if (error) throw error
      await loadData() // Recarrega a tela
      alert('Bem-vindo ao grupo!')
    } catch (error: any) {
      alert('Erro ao entrar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copiado! Mande para os amigos.')
  }

  if (!group) return <div className="p-10 text-center">Carregando...</div>

  // Verifica se eu já estou no grupo
  const isMember = members.some(m => m.user_id === currentUser?.id)
  
  // Calcula totais (simulado por enquanto, depois conectamos transações)
  const totalArrecadado = 0 
  const porcentagemGeral = (totalArrecadado / group.total_goal_amount) * 100

  return (
    <div className="min-h-screen bg-white">
      {/* Cabeçalho Azul */}
      <div className="bg-blue-600 p-6 pb-12 text-white">
        <div className="flex justify-between items-start">
            <Link href="/dashboard" className="inline-flex items-center text-blue-100 mb-4 hover:text-white">
            <ArrowLeft size={20} className="mr-1" /> Voltar
            </Link>
            <button 
                onClick={copyInviteLink}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                title="Copiar Link de Convite"
            >
                <Share2 size={20} />
            </button>
        </div>
        
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <div className="mt-4 opacity-90">
            <span className="text-sm">Meta do Grupo</span>
            <div className="text-3xl font-bold">
                R$ {group.total_goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-20">
        {/* Card de Progresso */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <p className="text-gray-500 text-sm font-bold mb-2">PROGRESSO</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(porcentagemGeral, 100)}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-500 mt-1">{porcentagemGeral.toFixed(1)}%</p>
        </div>

        {/* Botão de Entrar (Só aparece se não for membro) */}
        {!isMember && (
            <button 
                onClick={handleJoinGroup}
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl mb-6 shadow-md flex items-center justify-center gap-2 hover:bg-green-700 transition"
            >
                <LogIn size={24} />
                {loading ? 'Entrando...' : 'Participar do Grupo'}
            </button>
        )}

        {/* Lista de Participantes */}
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            Participantes <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{members.length}</span>
        </h3>
        
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden">
                    {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                    ) : (
                        <User size={20} />
                    )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {member.profiles?.full_name || 'Usuário sem nome'}
                     {member.role === 'admin' && <span className="text-xs text-blue-500 ml-2">(Admin)</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {members.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum participante ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
