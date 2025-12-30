'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Phone, Save, Loader2 } from 'lucide-react'

export default function ProfileModal({
    userId,
    onComplete
}: {
    userId: string
    onComplete: () => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (userId) checkProfile()
    }, [userId])

    const checkProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        // Se não tiver perfil ou não tiver nome preenchido, abre modal
        if (!data || !data.full_name) {
            setIsOpen(true)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName,
                    phone: phone,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            setIsOpen(false)
            onComplete()
            alert('Perfil atualizado!')
        } catch (error: any) {
            alert('Erro ao salvar perfil: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                        <User size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Complete seu Cadastro</h2>
                    <p className="text-slate-400">Para participar das vaquinhas, precisamos saber quem é você.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Nome Completo</label>
                        <div className="relative">
                            <User size={20} className="absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="text"
                                required
                                className="glass-input w-full p-3 pl-10 rounded-xl"
                                placeholder="Ex: Ana Silva"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Celular / WhatsApp</label>
                        <div className="relative">
                            <Phone size={20} className="absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="tel"
                                required
                                className="glass-input w-full p-3 pl-10 rounded-xl"
                                placeholder="(11) 99999-9999"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <> <Save size={20} /> Salvar Perfil </>}
                    </button>
                </form>
            </div>
        </div>
    )
}
