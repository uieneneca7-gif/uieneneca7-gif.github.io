-- =====================================================================
-- Banco de dados do portfólio (Supabase / PostgreSQL)
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- =====================================================================

-- ---------- Quem é o administrador ----------
-- Só este e-mail pode ler mensagens e alterar projetos.
create or replace function public.eh_admin()
returns boolean
language sql
stable
as $$
    select coalesce(auth.jwt() ->> 'email', '') = 'uieneneca7@gmail.com';
$$;


-- ---------- Tabela de projetos ----------
create table if not exists public.projetos (
    id           bigint generated always as identity primary key,
    titulo       text not null check (char_length(titulo) between 2 and 120),
    descricao    text not null check (char_length(descricao) between 5 and 600),
    tecnologias  text[] not null default '{}',
    link         text,
    categoria    text not null default 'sistema' check (categoria in ('sistema', 'exercicio')),
    ordem        integer not null default 0,
    publicado    boolean not null default true,
    criado_em    timestamptz not null default now()
);

alter table public.projetos enable row level security;

-- Qualquer visitante vê apenas os projetos publicados
drop policy if exists "visitantes veem projetos publicados" on public.projetos;
create policy "visitantes veem projetos publicados"
    on public.projetos for select
    to anon, authenticated
    using (publicado or public.eh_admin());

-- Só o admin cadastra, edita e exclui
drop policy if exists "admin gerencia projetos" on public.projetos;
create policy "admin gerencia projetos"
    on public.projetos for all
    to authenticated
    using (public.eh_admin())
    with check (public.eh_admin());


-- ---------- Tabela de mensagens do formulário ----------
create table if not exists public.mensagens (
    id         bigint generated always as identity primary key,
    nome       text not null check (char_length(nome) between 2 and 100),
    email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 150),
    mensagem   text not null check (char_length(mensagem) between 10 and 1000),
    lida       boolean not null default false,
    criado_em  timestamptz not null default now()
);

alter table public.mensagens enable row level security;

-- Visitantes podem apenas ENVIAR mensagens (não leem as dos outros)
drop policy if exists "visitantes enviam mensagens" on public.mensagens;
create policy "visitantes enviam mensagens"
    on public.mensagens for insert
    to anon, authenticated
    with check (lida = false);

-- Só o admin lê, marca como lida e exclui
drop policy if exists "admin gerencia mensagens" on public.mensagens;
create policy "admin gerencia mensagens"
    on public.mensagens for all
    to authenticated
    using (public.eh_admin())
    with check (public.eh_admin());


-- ---------- Permissões de acesso às tabelas ----------
-- Projetos novos do Supabase não liberam as tabelas automaticamente.
-- As regras (policies) acima continuam valendo: isto só abre a porta, as policies decidem quem entra.
grant usage on schema public to anon, authenticated;
grant select on public.projetos to anon, authenticated;
grant insert, update, delete on public.projetos to authenticated;
grant insert on public.mensagens to anon, authenticated;
grant select, update, delete on public.mensagens to authenticated;
grant usage on all sequences in schema public to anon, authenticated;


-- ---------- Projetos iniciais (os que já estão no portfólio) ----------
insert into public.projetos (titulo, descricao, tecnologias, link, categoria, ordem)
select * from (values
    ('Sistema de Gerenciamento de Estoque',
     'Sistema desenvolvido com foco em eficiência, controle de dados e segurança. Permite acompanhar o inventário de produtos de forma intuitiva, aplicando lógica de programação e banco de dados.',
     array['HTML','CSS','JavaScript'], 'estoque.html', 'sistema', 1),
    ('Sistema de Soma dos Valores',
     'Um sistema simples para somar dois valores numéricos, praticando captura de dados do formulário e manipulação do DOM.',
     array['HTML','CSS','JavaScript'], 'ex007.html', 'exercicio', 2),
    ('Verificador de Idade',
     'Calcula a idade do usuário com base no ano de nascimento e exibe uma imagem de acordo com a faixa etária e o sexo informado.',
     array['HTML','CSS','JavaScript'], 'modelo02.html', 'exercicio', 3)
) as v(titulo, descricao, tecnologias, link, categoria, ordem)
where not exists (select 1 from public.projetos);
