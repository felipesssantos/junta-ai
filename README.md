# Junta Aí 🤝💸

**Junta Aí** é uma plataforma moderna para gerenciamento de vaquinhas e despesas em grupo. Seja para uma viagem com amigos, o churrasco do fim de semana ou despesas compartilhadas de casa, o Junta Aí facilita o controle de quem pagou o quê e quanto falta para atingir a meta.

## 🚀 Funcionalidades

### Gestão de Grupos
- **Criação de Grupos**: Crie vaquinhas personalizadas com nome, meta financeira e categoria (Viagem, Casa, Festas, etc).
- **Categorias Inteligentes**: Ícones e identidade visual adaptados ao tipo do grupo.
- **Link de Convite**: Compartilhe o link do grupo (via WhatsApp ou copia e cola) para amigos entrarem facilmente.

### Financeiro
- **Metas Individuais**: Defina quanto cada participante deve contribuir.
- **Barra de Progresso**: Acompanhe visualmente o progresso de cada membro e do grupo como um todo.
- **Métricas em Tempo Real**:
  - **Saldo Arrecadado**: Total confirmado de pagamentos.
  - **Despesas**: Total gasto com comprovantes.
  - **Saldo em Caixa**: Valor disponível (Arrecadado - Despesas).

### Auditoria e Transparência
- **Comprovantes de Pagamento**: Membros enviam comprovantes (imagem/PDF) ao informar pagamento.
- **Registro de Despesas**: O dono do grupo registra saídas (compras) anexando a nota fiscal.
- **Storage Seguro (MinIO)**: Todos os arquivos são armazenados localmente em servidor próprio, garantindo privacidade e sem custos de cloud externa.

### Monetização
- **Anúncios Contextuais**: Banners de parceiros (Booking, Amazon, etc) exibidos com base na categoria do grupo.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Estilização**: Tailwind CSS + Lucide React (Ícones)
- **Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Armazenamento**: [MinIO](https://min.io/) (Object Storage S3-compatible self-hosted)
- **Infraestrutura**:
  - **Docker & Docker Compose**: Containerização completa da aplicação.
  - **GitHub Actions**: Pipeline de CI/CD para deploy automático na VPS.
  - **VPS Linux**: Hospedagem em servidor Ubuntu.

---

## 📦 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Docker (opcional, para rodar MinIO localmente)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/junta-ai.git
cd junta-ai
```

### 2. Configure as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as chaves do Supabase e MinIO:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_supabase

# MinIO (Storage Local)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=sua_senha_secreta
MINIO_BUCKET_NAME=junta-ai-files
NEXT_PUBLIC_MINIO_URL=http://localhost:9000/junta-ai-files
```

### 3. Instale as dependências
```bash
npm install
# ou
pnpm install
```

### 4. Rode o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🐳 Deploy com Docker

O projeto está totalmente containerizado. Para rodar a versão de produção localmente ou no servidor:

### Build e Run
```bash
# Construir a imagem
docker build -t junta-ai-image .

# Rodar o container (Exemplo com injeção de env via arquivo)
docker run -d \
  --name junta-ai \
  --restart unless-stopped \
  --network host \
  --env-file .env.local \
  --memory="512m" \
  --cpus="0.5" \
  junta-ai-image
```

> **Nota**: Utilizamos `--network host` para facilitar a comunicação entre o container do Next.js e o container do MinIO rodando no mesmo host (localhost).

---

## 🔄 Pipeline de CI/CD

O projeto possui um workflow do GitHub Actions (`.github/workflows/deploy.yml`) configurado para **Deploy Automático** na VPS.

### Fluxo de Deploy:
1.  **Push** na branch `main`.
2.  **SSH Action**: O GitHub conecta na VPS via SSH.
3.  **Configuração**: Cria o arquivo `.env.local` dinamicamente usando GitHub Secrets.
4.  **Hot Build**: Constrói a nova imagem Docker *antes* de parar o container antigo (Zero Downtime Build).
5.  **Switch**: Para o container antigo e sobe o novo instantaneamente.
6.  **Cleanup**: Remove imagens antigas para economizar espaço.

### Segredos Necessários (GitHub Repository Secrets):
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MINIO_...` (Credenciais do MinIO)

---

Desenvolvido por Felipe Santos.
