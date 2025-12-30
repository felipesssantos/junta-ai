import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-primary' })

export const metadata: Metadata = {
  title: 'JuntaAí - Gestão de Grupos',
  description: 'Gerencie vaquinhas e despesas em grupo de forma simples.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased selection:bg-blue-500/30 selection:text-white`}>
        {children}
      </body>
    </html>
  )
}
