import { Plane, Home, Store, TrendingUp, ExternalLink } from 'lucide-react'

interface AdBannerProps {
    category?: string
    variant?: 'horizontal' | 'compact'
    className?: string
}

export default function AdBanner({ category = 'geral', variant = 'horizontal', className = '' }: AdBannerProps) {
    // Logic to select ad content based on category
    const getAdContent = () => {
        switch (category?.toLowerCase()) {
            case 'viagem':
                return {
                    icon: <Plane size={24} className="text-blue-500" />,
                    title: 'Planejando a viagem?',
                    text: 'Encontre hotéis com até 50% de desconto no Booking.',
                    button: 'Ver Ofertas',
                    link: 'https://www.booking.com', // Affiliate Link Placeholder
                    bg: 'bg-blue-500/10 border-blue-500/20'
                }
            case 'casa':
                return {
                    icon: <Home size={24} className="text-orange-500" />,
                    title: 'Renove sua casa',
                    text: 'Móveis e decoração com entrega rápida na Amazon.',
                    button: 'Confira',
                    link: 'https://www.amazon.com.br', // Affiliate Link Placeholder
                    bg: 'bg-orange-500/10 border-orange-500/20'
                }
            case 'compras':
                return {
                    icon: <Store size={24} className="text-pink-500" />,
                    title: 'Lista de desejos?',
                    text: 'Compare preços e economize nas suas compras.',
                    button: 'Comparar',
                    link: 'https://www.buscape.com.br', // Affiliate Link Placeholder
                    bg: 'bg-pink-500/10 border-pink-500/20'
                }
            case 'outros':
                return {
                    icon: <TrendingUp size={24} className="text-slate-500" />,
                    title: 'Economize seus trocados',
                    text: 'Descubra formas de fazer seu dinheiro render mais.',
                    button: 'Ver Dicas',
                    link: '#',
                    bg: 'bg-slate-500/10 border-slate-500/20'
                }
            default:
                return {
                    icon: <TrendingUp size={24} className="text-emerald-500" />,
                    title: 'Faça seu dinheiro render',
                    text: 'Abra sua conta digital e ganhe cashback.',
                    button: 'Saiba Mais',
                    link: '#',
                    bg: 'bg-emerald-500/10 border-emerald-500/20'
                }
        }
    }

    const content = getAdContent()

    if (variant === 'compact') {
        return (
            <a
                href={content.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-xl border transition hover:opacity-90 ${content.bg} ${className}`}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">{content.icon}</div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-200">{content.title}</p>
                        <p className="text-xs text-slate-400 leading-tight">{content.text}</p>
                    </div>
                    <ExternalLink size={16} className="text-slate-500" />
                </div>
            </a>
        )
    }

    // Horizontal Variant (Default)
    return (
        <a
            href={content.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-4 rounded-2xl border transition hover:scale-[1.01] ${content.bg} ${className}`}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    {content.icon}
                </div>
                <div>
                    <p className="font-bold text-white text-sm uppercase tracking-wide opacity-80 mb-0.5">Patrocinado</p>
                    <h3 className="font-bold text-lg text-slate-100">{content.title}</h3>
                    <p className="text-sm text-slate-400">{content.text}</p>
                </div>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg text-sm font-bold text-white whitespace-nowrap hidden sm:block">
                {content.button}
            </div>
        </a>
    )
}
