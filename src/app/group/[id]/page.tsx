'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Share2, LogIn, Trophy, Copy, Plus, CheckCircle, XCircle, Clock, TrendingDown, FileText } from 'lucide-react'
import Link from 'next/link'
import AddExpenseModal from '../../../components/AddExpenseModal'

interface Member {
  user_id: string
  goal_amount: number
  profiles: {
    full_name: string
    avatar_url: string
    email: string
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
  user_id: string
  profiles: {
    full_name: string
  }
}

interface Expense {
  id: string
  description: string
  amount: number
  proof_url: string | null
  created_at: string
}

export default function GroupDetails() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Individual Goal Editing
  const [editingGoal, setEditingGoal] = useState<{ userId: string, amount: string } | null>(null)

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showAllPayments, setShowAllPayments] = useState(false)

  useEffect(() => {
    if (groupId) loadData()
  }, [groupId])

  useEffect(() => {
    if (!groupId) return

    // Realtime subscription
    const channel = supabase
      .channel('group_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `group_id=eq.${groupId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, () => loadData()) // Listen for member updates (goals)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    // 1. Group
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single()
    setGroup(groupData)

    // 2. Members (Added goal_amount)
    const { data: membersData } = await supabase.from('group_members')
      .select(`user_id, goal_amount, profiles ( full_name, avatar_url, email )`)
      .eq('group_id', groupId)
    if (membersData) setMembers(membersData as any)

    // 3. Payments
    const { data: paymentsData } = await supabase.from('payments')
      .select(`id, amount, status, created_at, user_id, profiles:user_id ( full_name )`)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    if (paymentsData) setPayments(paymentsData as any)

    // 4. Expenses
    const { data: expensesData } = await supabase.from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    if (expensesData) setExpenses(expensesData)
  }

  const handleJoinGroup = async () => {
    if (!currentUser) return alert('Faça login para entrar.')
    setLoading(true)
    try {
      const { error } = await supabase.from('group_members').insert([{ group_id: groupId, user_id: currentUser.id }])
      if (error) throw error
      await loadData()
      alert('Bem-vindo!')
    } catch (e: any) { alert('Erro: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleUpdateGoal = async (userId: string, newAmount: string) => {
    try {
      const amount = parseFloat(newAmount)
      if (isNaN(amount)) return

      const { error } = await supabase
        .from('group_members')
        .update({ goal_amount: amount })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      setEditingGoal(null)
      loadData() // Refresh
    } catch (error) {
      console.error(error)
      alert('Erro ao atualizar meta.')
    }
  }

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentAmount) return
    setLoading(true)
    try {
      const { error } = await supabase.from('payments').insert([{ group_id: groupId, user_id: currentUser.id, amount: parseFloat(paymentAmount), status: 'PENDING' }])
      if (error) throw error
      alert('Pagamento enviado!')
      setShowPaymentModal(false)
      setPaymentAmount('')
      loadData()
    } catch (e: any) { alert('Erro: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleConfirmPayment = async (paymentId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p))
    await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado!')
  }

  if (!group) return <div className="p-10 text-center text-white">Carregando...</div>

  const isMember = members.some(m => m.user_id === currentUser?.id)
  const isOwner = group.owner_id === currentUser?.id

  // Totals
  const totalArrecadado = payments.filter(p => p.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.amount, 0)
  const totalDespesas = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  const saldoAtual = totalArrecadado - totalDespesas
  const porcentagemGeral = (totalArrecadado / group.total_goal_amount) * 100

  return (
    <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </Link>
        <button onClick={() => copyToClipboard(window.location.href)} className="bg-slate-800/50 p-2 rounded-full hover:bg-slate-700 text-slate-400">
          <Share2 size={20} />
        </button>
      </div>

      {/* Main Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy size={160} /></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>

          {group.pix_key && (
            <div className="bg-slate-900/50 p-3 rounded-xl inline-flex items-center gap-3 mb-6 border border-white/5 cursor-pointer hover:bg-slate-900/80 transition" onClick={() => copyToClipboard(group.pix_key)}>
              <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400"><Copy size={16} /></div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Chave PIX</p>
                <p className="text-sm font-mono text-emerald-200">{group.pix_key}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-slate-400 text-sm mb-1">Saldo Arrecadado</p>
              <div className="text-4xl font-bold text-white">
                R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              {totalDespesas > 0 && (
                <div className="text-sm text-red-300 mt-1 flex items-center gap-1">
                  - R$ {totalDespesas.toLocaleString('pt-BR')} em despesas
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs uppercase font-bold">Meta</p>
              <p className="text-slate-400 font-bold">R$ {group.total_goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Progresso (Bruto)</span>
              <span>{porcentagemGeral.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950/50 rounded-full h-3 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(porcentagemGeral, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isOwner && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => setShowExpenseModal(true)} className="py-4 rounded-xl flex flex-col items-center justify-center gap-2 font-bold bg-slate-800 text-red-400 hover:bg-slate-700 transition border border-red-500/10">
            <TrendingDown size={24} /> Registrar Saída
          </button>

          {/* If user is also a member, show contribute button here? Or keep below */}
        </div>
      )}

      {/* Member Actions */}
      {isMember && (
        <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 rounded-xl mb-8 flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-95 transition">
          <Plus size={20} /> Informar Pagamento (Entrada)
        </button>
      )}

      {!isMember && (
        <button onClick={handleJoinGroup} disabled={loading} className="w-full btn-primary py-4 rounded-xl mb-8 flex items-center justify-center gap-2 font-bold">
          <LogIn size={20} /> Entrar no Grupo
        </button>
      )}


      {/* Admin: Approvals */}
      {isOwner && payments.some(p => p.status === 'PENDING') && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl mb-8">
          <h3 className="text-lg font-bold text-orange-200 mb-4 flex items-center gap-2"><Clock size={20} /> Aprovações Pendentes</h3>
          <div className="space-y-3">
            {payments.filter(p => p.status === 'PENDING').map(p => (
              <div key={p.id} className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-between border border-white/5">
                <div>
                  <p className="font-bold text-white text-lg">R$ {p.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{p.profiles?.full_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleConfirmPayment(p.id, 'CONFIRMED')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Aprovar</button>
                  <button onClick={() => handleConfirmPayment(p.id, 'REJECTED')} className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm font-bold">Recusar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="glass-panel p-6 rounded-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          Despesas / Saídas <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{expenses.length}</span>
        </h3>
        <div className="space-y-4">
          {(showAllExpenses ? expenses : expenses.slice(0, 5)).map(e => (
            <div key={e.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><TrendingDown size={18} /></div>
                <div>
                  <p className="font-bold text-slate-200">{e.description}</p>
                  <p className="text-xs text-slate-500">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-400">- R$ {e.amount.toFixed(2)}</p>
                {e.proof_url && (
                  <a href={e.proof_url} target="_blank" className="text-[10px] text-blue-400 hover:underline flex items-center justify-end gap-1"><FileText size={10} /> Ver Nota</a>
                )}
              </div>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-center text-slate-500 text-sm">Nenhuma despesa registrada.</p>}

          {expenses.length > 5 && (
            <button
              onClick={() => setShowAllExpenses(!showAllExpenses)}
              className="w-full pt-4 pb-2 text-sm text-slate-400 hover:text-white transition font-bold flex items-center justify-center gap-2"
            >
              {showAllExpenses ? 'Recolher' : `Ver todas (${expenses.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Incoming History */}
      <div className="glass-panel p-6 rounded-3xl mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          Entradas Recentes <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{payments.filter(p => p.status !== 'PENDING').length}</span>
        </h3>
        <div className="space-y-4">
          {(showAllPayments ? payments.filter(p => p.status !== 'PENDING') : payments.filter(p => p.status !== 'PENDING').slice(0, 5)).map(p => (
            <div key={p.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${p.status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {p.status === 'CONFIRMED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
                <div>
                  <p className="font-bold text-slate-200">R$ {p.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{p.profiles?.full_name} • {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${p.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {p.status === 'CONFIRMED' ? 'Pago' : 'Recusado'}
              </span>
            </div>
          ))}

          {payments.filter(p => p.status !== 'PENDING').length > 5 && (
            <button
              onClick={() => setShowAllPayments(!showAllPayments)}
              className="w-full pt-4 pb-2 text-sm text-slate-400 hover:text-white transition font-bold flex items-center justify-center gap-2"
            >
              {showAllPayments ? 'Recolher' : `Ver todas (${payments.filter(p => p.status !== 'PENDING').length})`}
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">Participantes ({members.length})</h3>
        <div className="space-y-6">
          {members.map(m => {
            const total = payments.filter(p => p.user_id === m.user_id && p.status === 'CONFIRMED').reduce((a, b) => a + b.amount, 0)
            const goal = m.goal_amount || 0
            const progress = goal > 0 ? (total / goal) * 100 : 0

            return (
              <div key={m.user_id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 overflow-hidden border-2 border-slate-700/50">
                      {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{m.profiles?.full_name || 'Sem nome'}</p>
                      {m.profiles?.email && <p className="text-[10px] text-slate-500">{m.profiles.email}</p>}
                      <div className="flex items-center gap-2">
                        {group.owner_id === m.user_id && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 rounded-full">OWNER</span>}
                        {goal > 0 && <span className="text-[10px] font-bold text-slate-400">Meta: R$ {goal.toLocaleString('pt-BR')}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions for Goal */}
                  {isOwner ? (
                    editingGoal?.userId === m.user_id ? (
                      <div className="flex items-center gap-2 animate-in fade-in">
                        <input
                          autoFocus
                          type="number"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                          placeholder="0.00"
                          value={editingGoal.amount}
                          onChange={(e) => setEditingGoal({ ...editingGoal, amount: e.target.value })}
                        />
                        <button
                          onClick={() => handleUpdateGoal(m.user_id, editingGoal.amount)}
                          className="bg-emerald-500 text-white p-1 rounded-lg hover:bg-emerald-600 transition"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setEditingGoal(null)}
                          className="bg-slate-700 text-slate-300 p-1 rounded-lg hover:bg-slate-600 transition"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingGoal({ userId: m.user_id, amount: m.goal_amount?.toString() || '' })}
                        className="text-slate-500 hover:text-emerald-400 transition"
                        title="Definir Meta Individual"
                      >
                        <TrendingDown size={18} className="rotate-180" /> {/* Using TrendingDown rotated as Target icon replacement */}
                      </button>
                    )
                  ) : null}
                </div>

                {/* Progress Bar (Only if goal exists) */}
                {goal > 0 && (
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between text-xs">
                      <span className={`font-bold ${total >= goal ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {total >= goal ? 'Meta Batida! 🎉' : `R$ ${total.toLocaleString('pt-BR')} pago`}
                      </span>
                      <span className="text-slate-500 font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-slate-800">
                      <div
                        style={{ width: `${Math.min(progress, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${total >= goal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Fallback Display if no goal */}
                {goal === 0 && total > 0 && (
                  <p className="text-xs text-emerald-400 font-bold pl-16">+ R$ {total.toFixed(2)} pago</p>
                )}

              </div>
            )
          })}
        </div>
      </div>

      <AddExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} groupId={groupId} onSuccess={loadData} />

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl relative animate-in zoom-in-95">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><XCircle size={24} /></button>
            <h3 className="text-xl font-bold text-white mb-1">Informar Pagamento</h3>
            <form onSubmit={handleReportPayment} className="mt-4">
              <input autoFocus type="number" step="0.01" required className="glass-input w-full p-4 text-2xl font-bold text-emerald-400 rounded-xl mb-4" placeholder="0,00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              <button disabled={loading} className="btn-primary w-full py-4 rounded-xl font-bold justify-center">{loading ? '...' : 'Confirmar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
