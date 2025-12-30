'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Share2, LogIn, Trophy, Copy, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Member {
  user_id: string
  // role removed
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

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  created_at: string
  user_id: string // Add this
  profiles: {
    full_name: string
  }
}

export default function GroupDetails() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    if (groupId) loadData()
  }, [groupId])

  useEffect(() => {
    if (!groupId) return

    // Inscreve no canal "realtime" para ouvir mudanças na tabela payments
    const channel = supabase
      .channel('payments_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `group_id=eq.${groupId}` },
        (payload) => {
          console.log('Change received!', payload)
          loadData() // Recarrega dados quando houver mudança
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    // 1. Group Data
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    setGroup(groupData)

    // 2. Members
    const { data: membersData } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles ( full_name, avatar_url )
      `)
      .eq('group_id', groupId)

    if (membersData) setMembers(membersData as any)

    // 3. Payments (Fetch recent payments)
    const { data: paymentsData, error: paymentError } = await supabase
      .from('payments')
      .select(`
            id, amount, status, created_at, user_id,
            profiles:user_id ( full_name )
        `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (paymentError) {
      console.error('Error fetching payments:', paymentError)
    }

    if (paymentsData) setPayments(paymentsData as any)
  }

  const handleJoinGroup = async () => {
    if (!currentUser) {
      alert('Você precisa fazer login para entrar no grupo.')
      window.location.href = '/'
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id
        }])

      if (error) throw error
      await loadData()
      alert('Bem-vindo ao grupo!')
    } catch (error: any) {
      alert('Erro ao entrar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentAmount) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id,
          amount: parseFloat(paymentAmount),
          status: 'PENDING'
        }])

      if (error) throw error
      alert('Pagamento informado! Aguarde confirmação do ADM.')
      setShowPaymentModal(false)
      setPaymentAmount('')
      loadData()
    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (paymentId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    // Optimistic update
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p))

    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId)

    if (error) alert('Erro ao atualizar pagamento')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado!')
  }

  if (!group) return <div className="p-10 text-center text-white">Carregando...</div>

  const isMember = members.some(m => m.user_id === currentUser?.id)
  const isOwner = group.owner_id === currentUser?.id

  // Calculate totals based on Confirmed payments
  const totalArrecadado = payments
    .filter(p => p.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const porcentagemGeral = (totalArrecadado / group.total_goal_amount) * 100

  return (
    <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </Link>
        <button
          onClick={() => copyToClipboard(window.location.href)}
          className="bg-slate-800/50 p-2 rounded-full hover:bg-slate-700 hover:text-white transition text-slate-400"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Main Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy size={160} />
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>

          {/* Pix Key Display */}
          {group.pix_key && (
            <div className="bg-slate-900/50 p-3 rounded-xl inline-flex items-center gap-3 mb-6 border border-white/5 cursor-pointer hover:bg-slate-900/80 transition" onClick={() => copyToClipboard(group.pix_key)}>
              <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                <Copy size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Chave PIX</p>
                <p className="text-sm font-mono text-emerald-200">{group.pix_key}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-slate-400 text-sm mb-1">Arrecadado</p>
              <div className="text-4xl font-bold text-white">
                R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs uppercase font-bold">Meta</p>
              <p className="text-slate-400 font-bold">R$ {group.total_goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Progresso</span>
              <span>{porcentagemGeral.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950/50 rounded-full h-3 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${Math.min(porcentagemGeral, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {isMember && !isOwner && payments.filter(p => p.profiles?.full_name === currentUser?.user_metadata?.full_name || p.amount > 0).length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-8 flex items-start gap-4">
          <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-yellow-200 font-bold mb-1">Hora de Contribuir!</h4>
            <p className="text-yellow-400/80 text-sm">Você ainda não informou nenhum pagamento para este grupo.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isMember ? (
        <button
          onClick={handleJoinGroup}
          disabled={loading}
          className="w-full btn-primary py-4 rounded-xl mb-8 flex items-center justify-center gap-2 font-bold"
        >
          <LogIn size={20} /> Entrar no Grupo
        </button>
      ) : (
        <button
          onClick={() => setShowPaymentModal(true)}
          className="w-full py-4 rounded-xl mb-8 flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-lg shadow-emerald-900/20 transition transform active:scale-95"
        >
          <Plus size={20} /> Informar Pagamento
        </button>
      )}

      {/* Admin: Pending Approvals Zone */}
      {isOwner && payments.some(p => p.status === 'PENDING') && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl mb-8 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-orange-200 mb-4 flex items-center gap-2">
            <Clock size={20} /> Aprovações Pendentes
          </h3>
          <div className="space-y-3">
            {payments.filter(p => p.status === 'PENDING').map(payment => (
              <div key={payment.id} className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-between border border-white/5">
                <div>
                  <p className="font-bold text-white text-lg">R$ {payment.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{payment.profiles?.full_name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmPayment(payment.id, 'CONFIRMED')}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleConfirmPayment(payment.id, 'REJECTED')}
                    className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History (Non-Pending) */}
      <div className="glass-panel p-6 rounded-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          Histórico <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{payments.filter(p => p.status !== 'PENDING').length}</span>
        </h3>

        <div className="space-y-4">
          {payments.filter(p => p.status !== 'PENDING').map(payment => (
            <div key={payment.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                            ${payment.status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    payment.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                  {payment.status === 'CONFIRMED' ? <CheckCircle size={18} /> :
                    payment.status === 'REJECTED' ? <XCircle size={18} /> :
                      <Clock size={18} />}
                </div>
                <div>
                  <p className="font-bold text-slate-200">R$ {payment.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">
                    {payment.profiles?.full_name} • {new Date(payment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md
                            ${payment.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                  payment.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                }`}>
                {payment.status === 'CONFIRMED' ? 'Pago' : 'Recusado'}
              </span>
            </div>
          ))}
          {payments.filter(p => p.status !== 'PENDING').length === 0 && <p className="text-center text-slate-500 py-4">Nenhum pagamento no histórico.</p>}
        </div>
      </div>

      {/* Participants List */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          Participantes <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{members.length}</span>
        </h3>

        <div className="space-y-4">
          {members.map((member) => {
            // Calculate total confirmed contribution for this member
            const totalContributed = payments
              .filter(p => p.user_id === member.user_id && p.status === 'CONFIRMED')
              .reduce((acc, curr) => acc + curr.amount, 0)

            return (
              <div key={member.user_id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 overflow-hidden border-2 border-slate-700/50">
                    {member.profiles?.avatar_url ? (
                      <img src={member.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">
                      {member.profiles?.full_name || 'Usuário sem nome'}
                    </p>
                    <div className="flex items-center gap-2">
                      {group?.owner_id === member.user_id && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Owner</span>
                      )}
                      {/* Admin View: Show Total Contributed */}
                      {isOwner && totalContributed > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          + R$ {totalContributed.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl relative animate-in zoom-in-95">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <XCircle size={24} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Informar Pagamento</h3>
            <p className="text-slate-400 text-sm mb-6">Qual valor você depositou?</p>

            <form onSubmit={handleReportPayment}>
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Valor (R$)</label>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  required
                  className="glass-input w-full p-4 text-2xl font-bold text-emerald-400 rounded-xl"
                  placeholder="0,00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
              </div>
              <button disabled={loading} className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center">
                {loading ? 'Enviando...' : 'Confirmar Envio'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
