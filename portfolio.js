// ===== Configuração =====
// E-mail que vai receber as mensagens do formulário
const EMAIL_CONTATO = 'uieneneca7@gmail.com';

// Frases do efeito de digitação na Home
const FRASES = [
    'Estudante de ADS',
    'Suporte Técnico',
    'Redes de Computadores',
    'Cibersegurança',
    'Desenvolvedor Web em formação'
];

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Tema claro / escuro =====
const temaToggle = document.getElementById('temaToggle');

function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    temaToggle.textContent = tema === 'claro' ? '☀️' : '🌙';
    localStorage.setItem('tema', tema);
}

aplicarTema(localStorage.getItem('tema') || 'escuro');

temaToggle.addEventListener('click', () => {
    const atual = document.documentElement.dataset.tema;
    aplicarTema(atual === 'claro' ? 'escuro' : 'claro');
});

// ===== Menu do celular =====
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

function fecharMenu() {
    menu.classList.remove('aberto');
    menuToggle.classList.remove('aberto');
    menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    menuToggle.classList.toggle('aberto', aberto);
    menuToggle.setAttribute('aria-expanded', String(aberto));
});

menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', fecharMenu));

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharMenu();
});

// ===== Rolagem: barra de progresso, sombra no topo e botão voltar =====
const topo = document.getElementById('topo');
const progresso = document.getElementById('progresso');
const voltarTopo = document.getElementById('voltarTopo');

function aoRolar() {
    const rolado = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;

    progresso.style.width = total > 0 ? `${(rolado / total) * 100}%` : '0';
    topo.classList.toggle('rolado', rolado > 10);
    voltarTopo.classList.toggle('visivel', rolado > 500);
}

window.addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

voltarTopo.addEventListener('click', () => window.scrollTo({ top: 0 }));

// ===== Link ativo no menu conforme a seção visível =====
const linksMenu = menu.querySelectorAll('a[href^="#"]');

const observadorSecoes = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        linksMenu.forEach((link) => {
            link.classList.toggle('ativo', link.getAttribute('href') === `#${entrada.target.id}`);
        });
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((secao) => observadorSecoes.observe(secao));

// ===== Seções aparecendo ao rolar + contadores =====
function animarContador(el) {
    const alvo = Number(el.dataset.alvo);
    if (reduzirMovimento) {
        el.textContent = alvo;
        return;
    }
    const duracao = 1200;
    const inicio = performance.now();

    function passo(agora) {
        const t = Math.min((agora - inicio) / duracao, 1);
        el.textContent = Math.round(alvo * t);
        if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
}

const observadorRevelar = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        entrada.target.querySelectorAll('.contador').forEach(animarContador);
        obs.unobserve(entrada.target);
    });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach((el) => observadorRevelar.observe(el));

// ===== Efeito de digitação =====
const digitando = document.getElementById('digitando');

if (!reduzirMovimento) {
    let frase = 0;
    let letra = FRASES[0].length;
    let apagando = true;

    function digitar() {
        const texto = FRASES[frase];
        letra += apagando ? -1 : 1;
        digitando.textContent = texto.slice(0, letra);

        let espera = apagando ? 45 : 90;

        if (!apagando && letra === texto.length) {
            apagando = true;
            espera = 1800;
        } else if (apagando && letra === 0) {
            apagando = false;
            frase = (frase + 1) % FRASES.length;
            espera = 300;
        }
        setTimeout(digitar, espera);
    }
    setTimeout(digitar, 1800);
}

// ===== Filtro de projetos =====
const filtros = document.querySelectorAll('.filtro');
const gridProjetos = document.querySelector('.projetos-grid');

filtros.forEach((botao) => {
    botao.addEventListener('click', () => {
        const escolhido = botao.dataset.filtro;
        filtros.forEach((b) => b.classList.toggle('ativo', b === botao));

        gridProjetos.querySelectorAll('.projeto-card').forEach((card) => {
            const categoria = card.dataset.categoria;
            const mostrar = escolhido === 'todos' || categoria === 'todos' || categoria === escolhido;
            card.classList.toggle('escondido', !mostrar);
        });
    });
});

// ===== Efeito 3D nos cards (só com mouse) =====
const usarEfeito3D = !reduzirMovimento && window.matchMedia('(hover: hover)').matches;

function ativarEfeito3D(card) {
    if (!usarEfeito3D) return;
    card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
}

gridProjetos.querySelectorAll('.projeto-card').forEach(ativarEfeito3D);

// ===== Projetos vindos do banco de dados =====
// Se o banco não estiver configurado ou falhar, ficam os projetos escritos no HTML.
function linkSeguro(url) {
    return /^(https?:\/\/|[\w\-./]+\.html?$)/i.test(url || '') ? url : null;
}

function criarCardProjeto(projeto) {
    const card = document.createElement('article');
    card.className = 'projeto-card';
    card.dataset.categoria = projeto.categoria;

    const titulo = document.createElement('h3');
    titulo.textContent = projeto.titulo;

    const descricao = document.createElement('p');
    descricao.textContent = projeto.descricao;

    const tags = document.createElement('ul');
    tags.className = 'tags';
    (projeto.tecnologias || []).forEach((tec) => {
        const li = document.createElement('li');
        li.textContent = tec;
        tags.appendChild(li);
    });

    card.append(titulo, descricao, tags);

    const link = linkSeguro(projeto.link);
    if (link) {
        const botao = document.createElement('a');
        botao.className = 'btn';
        botao.href = link;
        botao.target = '_blank';
        botao.rel = 'noopener noreferrer';
        botao.textContent = 'Acessar o sistema';
        card.appendChild(botao);
    }

    ativarEfeito3D(card);
    return card;
}

// Chamada direta à API REST do Supabase (sem a biblioteca, para o site carregar rápido)
async function chamarBanco(caminho, opcoes = {}) {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
        ...opcoes,
        headers: { apikey: SUPABASE_CHAVE, 'Content-Type': 'application/json', ...opcoes.headers }
    });
    if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.message || `HTTP ${resposta.status}`);
    }
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
}

async function carregarProjetos() {
    if (!bancoConfigurado) return;

    let data;
    try {
        data = await chamarBanco('projetos?select=titulo,descricao,tecnologias,link,categoria&publicado=eq.true&order=ordem,criado_em.desc');
    } catch (erro) {
        console.warn('Não foi possível carregar os projetos do banco:', erro.message);
        return;
    }

    // Troca os cards do HTML pelos do banco, mantendo o card "Em breve" no final
    const emBreve = gridProjetos.querySelector('.projeto-breve');
    gridProjetos.querySelectorAll('.projeto-card:not(.projeto-breve)').forEach((c) => c.remove());
    data.forEach((projeto) => gridProjetos.insertBefore(criarCardProjeto(projeto), emBreve));

    // Atualiza o número de "Projetos publicados" na seção Sobre
    const contadorProjetos = document.querySelector('.contador[data-alvo]');
    contadorProjetos.dataset.alvo = data.length;
    if (contadorProjetos.closest('.revelar').classList.contains('visivel')) {
        contadorProjetos.textContent = data.length;
    }

    // Reaplica o filtro que estiver selecionado
    document.querySelector('.filtro.ativo').click();
}

carregarProjetos();

// ===== Aviso (toast) =====
const toast = document.getElementById('toast');
let toastTimer;

function mostrarAviso(mensagem, erro = false) {
    toast.textContent = mensagem;
    toast.classList.toggle('erro-toast', erro);
    toast.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('mostrar'), 3500);
}

// ===== Formulário de contato =====
const form = document.getElementById('formContato');
const mensagem = document.getElementById('mensagem');
const contadorMsg = document.getElementById('contadorMsg');

const MENSAGENS_ERRO = {
    nome: 'Informe seu nome (mínimo 2 letras).',
    email: 'Informe um e-mail válido.',
    mensagem: 'Escreva uma mensagem com pelo menos 10 caracteres.'
};

function validarCampo(input) {
    input.value = input.value.trimStart();
    const valido = input.checkValidity() && input.value.trim().length > 0;
    const campo = input.closest('.campo');
    campo.classList.toggle('invalido', !valido);
    campo.querySelector('.erro').textContent = valido ? '' : MENSAGENS_ERRO[input.name];
    return valido;
}

mensagem.addEventListener('input', () => {
    contadorMsg.textContent = `${mensagem.value.length} / ${mensagem.maxLength}`;
});

const camposForm = [...form.querySelectorAll('.campo input, .campo textarea')];
const botaoEnviar = form.querySelector('button[type="submit"]');

camposForm.forEach((input) => {
    input.addEventListener('blur', () => validarCampo(input));
    input.addEventListener('input', () => {
        if (input.closest('.campo').classList.contains('invalido')) validarCampo(input);
    });
});

function abrirEmail(dados) {
    const assunto = encodeURIComponent(`Contato pelo portfólio - ${dados.nome}`);
    const corpo = encodeURIComponent(`${dados.mensagem}\n\n${dados.nome} <${dados.email}>`);
    window.location.href = `mailto:${EMAIL_CONTATO}?subject=${assunto}&body=${corpo}`;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const todosValidos = camposForm.map(validarCampo).every(Boolean);

    if (!todosValidos) {
        mostrarAviso('Verifique os campos destacados.', true);
        camposForm.find((c) => c.closest('.campo').classList.contains('invalido')).focus();
        return;
    }

    // Campo invisível: se foi preenchido, quem enviou foi um robô de spam
    if (form.site.value) return;

    const dados = {
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        mensagem: form.mensagem.value.trim()
    };

    if (bancoConfigurado) {
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Enviando...';
        try {
            await chamarBanco('mensagens', {
                method: 'POST',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify(dados)
            });
        } catch (erro) {
            console.warn('Erro ao salvar a mensagem:', erro.message);
            mostrarAviso('Não foi possível enviar agora. Abrindo seu e-mail...', true);
            abrirEmail(dados);
            return;
        } finally {
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = 'Enviar mensagem';
        }
        mostrarAviso(`Obrigado, ${dados.nome}! Sua mensagem foi enviada.`);
    } else {
        // Sem banco configurado: abre o programa de e-mail do visitante já preenchido
        abrirEmail(dados);
        mostrarAviso(`Obrigado, ${dados.nome}! Seu e-mail foi preparado.`);
    }

    form.reset();
    contadorMsg.textContent = `0 / ${mensagem.maxLength}`;
});

// ===== E-mail e WhatsApp (montados aqui para não ficarem expostos no HTML) =====
const linkEmail = document.getElementById('linkEmail');
const emailCompleto = `${linkEmail.dataset.usuario}@${linkEmail.dataset.dominio}`;
linkEmail.href = `mailto:${emailCompleto}`;
document.getElementById('textoEmail').textContent = emailCompleto;

const linkWhats = document.getElementById('linkWhats');
const textoWhats = encodeURIComponent('Olá, Uie! Vi seu portfólio e gostaria de conversar.');
linkWhats.href = `https://wa.me/${linkWhats.dataset.numero.split(',').join('')}?text=${textoWhats}`;

// ===== Ano automático no rodapé =====
document.getElementById('ano').textContent = new Date().getFullYear();
