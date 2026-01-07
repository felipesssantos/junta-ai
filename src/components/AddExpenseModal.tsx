'use client'

import { useState } from 'react'
import { X, Upload, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import imageCompression from 'browser-image-compression'
import { getPresignedUrl } from '../actions/storage'

interface AddExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string
    onSuccess: () => void
}

export default function AddExpenseModal({ isOpen, onClose, groupId, onSuccess }: AddExpenseModalProps) {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [compressing, setCompressing] = useState(false)

    if (!isOpen) return null

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0]
        if (!originalFile) return

        // Only compress images
        if (originalFile.type.startsWith('image/')) {
            setCompressing(true)
            try {
                const options = {
                    maxSizeMB: 1, // Max 1MB
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    initialQuality: 0.8
                }

                console.log(`Original size: ${(originalFile.size / 1024 / 1024).toFixed(2)} MB`)
                const compressedFile = await imageCompression(originalFile, options)
                console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)

                setFile(compressedFile)
            } catch (error) {
                console.error('Error compressing image:', error)
                setFile(originalFile) // Fallback to original
            } finally {
                setCompressing(false)
            }
        } else {
            // PDF or other files: Check size limit (3MB)
            const MAX_SIZE_MB = 3
            if (originalFile.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`Arquivo muito grande! O limite para PDFs é de ${MAX_SIZE_MB}MB. Por favor, comprima o arquivo.`)
                e.target.value = '' // Reset input
                setFile(null)
                return
            }
            setFile(originalFile)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let proofUrl = null

            // 1. Upload File (if selected)
            if (file) {
                // Upload (MinIO)
                const fileExt = file.name.split('.').pop()
                const fileName = `receipts/${groupId}/${Date.now()}.${fileExt}`

                // 1. Get Presigned URL
                const { presignedUrl, publicUrl } = await getPresignedUrl(fileName)

                // 2. Upload directly to MinIO
                const uploadRes = await fetch(presignedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                })

                if (!uploadRes.ok) throw new Error('Falha no upload para o Storage')

                proofUrl = publicUrl
            }

            // 2. Insert Expense Record
            const { error: insertError } = await supabase
                .from('expenses')
                .insert({
                    group_id: groupId,
                    description,
                    amount: parseFloat(amount),
                    proof_url: proofUrl
                })

            if (insertError) throw insertError

            onSuccess()
            onClose()
            setDescription('')
            setAmount('')
            setFile(null)
        } catch (error) {
            console.error('Error adding expense:', error)
            alert('Erro ao salvar despesa. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1A1F2E] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-xl relative animate-slide-up">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">Registrar Despesa</h2>
                <p className="text-slate-400 text-sm mb-6">Cadastre um gasto do grupo.</p>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Compra de Bebidas"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors font-mono text-lg"
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comprovante (Opcional)</label>
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-all
                ${file
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                    : 'bg-slate-900/30 border-slate-700 text-slate-400 group-hover:border-slate-500'
                                }
              `}>
                                {compressing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin text-yellow-500" />
                                        <span className="text-sm truncate text-yellow-500">Otimizando imagem...</span>
                                    </>
                                ) : file ? (
                                    <>
                                        <Check size={20} />
                                        <span className="text-sm truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        <span className="text-sm truncate">Clique para anexar foto ou PDF</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || compressing}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Salvando...
                            </>
                        ) : compressing ? (
                            'Aguarde a compressão...'
                        ) : (
                            'Confirmar Despesa'
                        )}
                    </button>

                </form>
            </div>
        </div>
    )
}
