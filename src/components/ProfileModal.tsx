'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Phone, Save, Loader2, X } from 'lucide-react'

interface ProfileModalProps {
    userId: string
    onComplete?: () => void
    isOpen?: boolean
    onClose?: () => void
}

export default function ProfileModal({
    userId,
    onComplete,
    isOpen: externalIsOpen,
    onClose
}: ProfileModalProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const showModal = externalIsOpen ?? internalIsOpen

    useEffect(() => {
        if (userId) {
            checkProfile()
        }
    }, [userId, externalIsOpen])

    const checkProfile = async () => {
        setFetching(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            setFullName(data.full_name || '')
            setPhone(data.phone || '')
            setEmail(data.email || '')
        }

        // Logic for auto-open (Onboarding)
        // Only if externalIsOpen is UNDEFINED (not controlled)
        if (externalIsOpen === undefined) {
            if (!data || !data.full_name) {
                setInternalIsOpen(true)
            }
        }
        setFetching(false)
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

            setInternalIsOpen(false)
            if (onClose) onClose()
            if (onComplete) onComplete()
            alert('Perfil atualizado!')
        } catch (error: any) {
            alert('Erro ao salvar perfil: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!showModal) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative animate-in zoom-in-95">

                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                )}

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400 border border-blue-500/20">
                        <User size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Seu Perfil</h2>
                    <p className="text-slate-400">antenha seus dados atualizados.</p>
                </div>

                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-400" size={32} />
                    </div>
                ) : (
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
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">E-mail</label>
                            <div className="relative">
                                <User size={20} className="absolute left-3 top-3.5 text-slate-500" />
                                <input
                                    type="email"
                                    disabled
                                    className="glass-input w-full p-3 pl-10 rounded-xl opacity-50 cursor-not-allowed"
                                    value={email}
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
                )}
            </div>
        </div>
    )
}
