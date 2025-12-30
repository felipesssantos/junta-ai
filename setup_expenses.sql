-- MÓDULO DE DESPESAS (SETUP)

-- 1. Criar Tabela de Despesas
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  description text not null,
  amount numeric not null check (amount > 0),
  proof_url text, -- URL da imagem do comprovante (opcional)
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

-- 2. Habilitar Segurança (RLS)
alter table expenses enable row level security;

-- 3. Políticas de Segurança para DESPESAS

-- LEITURA: Quem pode ver?
-- Membros do grupo e o Dono.
create policy "Expenses_Read" on expenses for select
to authenticated
using (
  -- A) Eu sou o dono do grupo
  exists (
    select 1 from groups
    where groups.id = expenses.group_id
    and groups.owner_id = auth.uid()
  )
  OR
  -- B) Eu sou membro do grupo (usando nossa função segura anti-loop)
  public.is_member_secure(group_id)
);

-- ESCRITA: Quem pode adicionar/editar/apagar?
-- APENAS o Dono do grupo.
create policy "Expenses_Manage_Owner" on expenses for all
to authenticated
using (
  exists (
    select 1 from groups
    where groups.id = expenses.group_id
    and groups.owner_id = auth.uid()
  )
);


-- 4. SETUP DE STORAGE (BUCKET)
-- Tenta criar o bucket 'expense-proofs' se não existir.
-- Nota: Isso requer permissões de admin no projeto. Se falhar, você terá que criar no painel.

insert into storage.buckets (id, name, public)
values ('expense-proofs', 'expense-proofs', true)
on conflict (id) do nothing;

-- Política de Storage:
-- Quem pode fazer UPLOAD? Qualquer autenticado (simplificado, depois validamos se é dono no front)
-- Quem pode LER? Qualquer um (bucket publico facilita a exibição da nota fiscal)

create policy "Upload Proofs"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'expense-proofs' );

create policy "View Proofs"
on storage.objects for select
to public
using ( bucket_id = 'expense-proofs' );
