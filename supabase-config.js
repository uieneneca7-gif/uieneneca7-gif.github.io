// ===== Conexão com o banco de dados (Supabase) =====
// Valores em: Supabase > Project Settings
//   - Data API > Project URL        -> SUPABASE_URL
//   - API Keys > Publishable key    -> SUPABASE_CHAVE
// A chave "publishable" pode ficar pública: quem protege os dados são as regras (RLS) do banco/schema.sql.
// NUNCA coloque aqui a chave "secret" (sb_secret_...).
const SUPABASE_URL = 'https://axedmockmvpajojedhug.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_p5sdqVE-VCS-cTHYMIb22w_m1vfb8D7';

const bancoConfigurado = !SUPABASE_URL.includes('SEU-PROJETO') && !SUPABASE_CHAVE.includes('SUA-CHAVE');

// Cliente completo (com login), usado só no painel admin, que carrega lib/supabase.js.
// O portfólio fala com o banco direto por fetch, sem precisar da biblioteca.
const banco = (window.supabase && bancoConfigurado)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE)
    : null;
