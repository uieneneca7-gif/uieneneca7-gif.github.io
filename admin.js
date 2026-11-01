// ===== Painel administrativo =====
// A segurança de verdade está no banco (regras RLS em banco/schema.sql):
// mesmo que alguém abra esta página, sem o login do admin o banco não entrega nada.

const $ = (id) => document.getElementById(id);

// ===== Aviso (toast) =====
let toastTimer;

function mostrarAviso(mensagem, erro = false) {
    const toast = $('toast');
    toast.textContent = mensagem;
    toast.classList.toggle('erro-toast', erro);
    toast.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('mostrar'), 3500);
}

// Cria um elemento com classe e texto (usa textContent para evitar injeção de HTML)
function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function criarBotao(texto, classe, aoClicar) {
    const botao = criar('button', `btn btn-pequeno ${classe}`, texto);
    botao.type = 'button';
    botao.addEventListener('click', aoClicar);
    return botao;
}

const formatarData = (iso) => new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
});

// ===== Telas =====
function mostrarTela(logado, email = '') {
    $('telaLogin').hidden = logado;
    $('telaPainel').hidden = !logado;
    $('topoAcoes').hidden = !logado;
    $('usuarioEmail').textContent = email;

    if (logado) {
        carregarMensagens();
        carregarProjetos();
    }
}

// ===== Login / logout =====
$('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginErro').textContent = '';

    const { error } = await banco.auth.signInWithPassword({
        email: $('loginEmail').value.trim(),
        password: $('loginSenha').value
    });

    if (error) {
        $('loginErro').textContent = 'E-mail ou senha incorretos.';
        return;
    }
    $('formLogin').reset();
});

$('btnSair').addEventListener('click', () => banco.auth.signOut());

// ===== Abas =====
document.querySelectorAll('[data-aba]').forEach((botao) => {
    botao.addEventListener('click', () => {
        document.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('ativo', b === botao));
        document.querySelectorAll('.aba').forEach((aba) => {
            aba.hidden = aba.id !== botao.dataset.aba;
        });
    });
});

// ===== Mensagens =====
let mensagens = [];

async function carregarMensagens() {
    const { data, error } = await banco
        .from('mensagens')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        mostrarAviso(`Erro ao carregar mensagens: ${error.message}`, true);
        return;
    }
    mensagens = data;
    desenharMensagens();
}

function desenharMensagens() {
    const lista = $('listaMensagens');
    const soNaoLidas = $('soNaoLidas').checked;
    const visiveis = soNaoLidas ? mensagens.filter((m) => !m.lida) : mensagens;

    $('badgeNaoLidas').textContent = mensagens.filter((m) => !m.lida).length;
    lista.replaceChildren();

    if (visiveis.length === 0) {
        lista.appendChild(criar('p', 'vazio', 'Nenhuma mensagem por aqui.'));
        return;
    }

    visiveis.forEach((m) => {
        const item = criar('article', `item-painel${m.lida ? '' : ' nao-lida'}`);

        const cabecalho = criar('div', 'item-cabecalho');
        cabecalho.append(
            criar('h3', '', m.nome),
            criar('span', 'item-info', formatarData(m.criado_em))
        );

        const email = criar('a', 'item-info', m.email);
        email.href = `mailto:${encodeURIComponent(m.email)}`;

        const acoes = criar('div', 'item-acoes');
        acoes.append(
            criarBotao(m.lida ? 'Marcar como não lida' : 'Marcar como lida', 'btn-contorno', () => marcarLida(m)),
            criarBotao('Responder', 'btn-contorno', () => {
                const assunto = encodeURIComponent('Re: Contato pelo portfólio');
                window.location.href = `mailto:${encodeURIComponent(m.email)}?subject=${assunto}`;
                if (!m.lida) marcarLida(m);
            }),
            criarBotao('Excluir', 'btn-perigo', () => excluir('mensagens', m.id, carregarMensagens))
        );

        item.append(cabecalho, email, criar('p', 'item-texto', m.mensagem), acoes);
        lista.appendChild(item);
    });
}

async function marcarLida(m) {
    const { error } = await banco.from('mensagens').update({ lida: !m.lida }).eq('id', m.id);
    if (error) {
        mostrarAviso(`Erro: ${error.message}`, true);
        return;
    }
    m.lida = !m.lida;
    desenharMensagens();
}

$('soNaoLidas').addEventListener('change', desenharMensagens);
$('btnAtualizar').addEventListener('click', carregarMensagens);

// ===== Excluir (mensagens ou projetos) =====
async function excluir(tabela, id, recarregar) {
    if (!confirm('Tem certeza que deseja excluir? Essa ação não pode ser desfeita.')) return;

    const { error } = await banco.from(tabela).delete().eq('id', id);
    if (error) {
        mostrarAviso(`Erro ao excluir: ${error.message}`, true);
        return;
    }
    mostrarAviso('Excluído com sucesso.');
    recarregar();
}

// ===== Projetos =====
async function carregarProjetos() {
    const { data, error } = await banco
        .from('projetos')
        .select('*')
        .order('ordem')
        .order('criado_em', { ascending: false });

    if (error) {
        mostrarAviso(`Erro ao carregar projetos: ${error.message}`, true);
        return;
    }
    desenharProjetos(data);
}

function desenharProjetos(projetos) {
    const lista = $('listaProjetos');
    lista.replaceChildren();

    if (projetos.length === 0) {
        lista.appendChild(criar('p', 'vazio', 'Nenhum projeto cadastrado.'));
        return;
    }

    projetos.forEach((p) => {
        const item = criar('article', `item-painel${p.publicado ? '' : ' oculto'}`);

        const cabecalho = criar('div', 'item-cabecalho');
        const categoria = p.categoria === 'sistema' ? 'Sistema' : 'Exercício JS';
        const status = p.publicado ? 'Publicado' : 'Oculto';
        cabecalho.append(
            criar('h3', '', p.titulo),
            criar('span', 'item-info', `${categoria} · ordem ${p.ordem} · ${status}`)
        );

        const tags = criar('ul', 'tags');
        (p.tecnologias || []).forEach((t) => tags.appendChild(criar('li', '', t)));

        const acoes = criar('div', 'item-acoes');
        acoes.append(
            criarBotao('Editar', 'btn-contorno', () => editarProjeto(p)),
            criarBotao(p.publicado ? 'Ocultar' : 'Publicar', 'btn-contorno', () => alternarPublicado(p)),
            criarBotao('Excluir', 'btn-perigo', () => excluir('projetos', p.id, carregarProjetos))
        );

        item.append(cabecalho, criar('p', 'item-texto', p.descricao), tags, acoes);
        if (p.link) item.insertBefore(criar('p', 'item-info', `Link: ${p.link}`), acoes);
        lista.appendChild(item);
    });
}

async function alternarPublicado(p) {
    const { error } = await banco.from('projetos').update({ publicado: !p.publicado }).eq('id', p.id);
    if (error) {
        mostrarAviso(`Erro: ${error.message}`, true);
        return;
    }
    carregarProjetos();
}

function editarProjeto(p) {
    $('projetoId').value = p.id;
    $('projetoTitulo').value = p.titulo;
    $('projetoDescricao').value = p.descricao;
    $('projetoTecnologias').value = (p.tecnologias || []).join(', ');
    $('projetoLink').value = p.link || '';
    $('projetoCategoria').value = p.categoria;
    $('projetoOrdem').value = p.ordem;
    $('projetoPublicado').checked = p.publicado;

    $('tituloFormProjeto').textContent = 'Editar projeto';
    $('btnCancelarEdicao').hidden = false;
    $('formProjeto').scrollIntoView({ behavior: 'smooth' });
}

function limparFormProjeto() {
    $('formProjeto').reset();
    $('projetoId').value = '';
    $('tituloFormProjeto').textContent = 'Novo projeto';
    $('btnCancelarEdicao').hidden = true;
}

$('btnCancelarEdicao').addEventListener('click', limparFormProjeto);

$('formProjeto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const projeto = {
        titulo: $('projetoTitulo').value.trim(),
        descricao: $('projetoDescricao').value.trim(),
        tecnologias: $('projetoTecnologias').value.split(',').map((t) => t.trim()).filter(Boolean),
        link: $('projetoLink').value.trim() || null,
        categoria: $('projetoCategoria').value,
        ordem: Number($('projetoOrdem').value) || 0,
        publicado: $('projetoPublicado').checked
    };

    const id = $('projetoId').value;
    const consulta = id
        ? banco.from('projetos').update(projeto).eq('id', id)
        : banco.from('projetos').insert(projeto);

    $('btnSalvarProjeto').disabled = true;
    const { error } = await consulta;
    $('btnSalvarProjeto').disabled = false;

    if (error) {
        mostrarAviso(`Erro ao salvar: ${error.message}`, true);
        return;
    }
    mostrarAviso(id ? 'Projeto atualizado!' : 'Projeto cadastrado!');
    limparFormProjeto();
    carregarProjetos();
});

// ===== Início =====
if (!banco) {
    $('avisoConfig').hidden = false;
} else {
    // Atualiza a tela sempre que o login mudar (entrar, sair, sessão expirada)
    banco.auth.onAuthStateChange((_evento, sessao) => {
        // setTimeout evita chamar o banco de dentro do próprio evento de login
        setTimeout(() => mostrarTela(Boolean(sessao), sessao ? sessao.user.email : ''), 0);
    });
}
