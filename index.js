const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'chave-super-reservada',
        resave: false,
        saveUninitialized: true,
    })
);

const porta = 3000;
const host = '0.0.0.0';

let usuarioArmazenado = null;
let mensagens = [];

// Função para verificar se o usuário está autenticado
function verificarAutenticacao(req, res, next) {
    if (req.session.autenticado) {
        next(); // Usuário autenticado, permitir acesso
    } else {
        res.redirect('/login'); // Redireciona para login se não autenticado
    }
}

// Função para gerar o menu principal
function montarMenu() {
    return `
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">Menu </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="/registrar">Cadastro de Usuários</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/chat">Bate Papo</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;
}

// Página inicial - Redireciona para o login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Página de login
app.get('/login', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Login</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container w-25 mt-5">
                    <form action='/login' method='POST' class="row g-3 needs-validation">
                        <fieldset class="border p-2">
                            <legend class="mb-3">Login</legend>
                            <div class="col-md-12">
                                <label for="usuario" class="form-label">Usuário:</label>
                                <input type="text" class="form-control" id="usuario" name="usuario" required>
                            </div>
                            <div class="col-md-12">
                                <label for="senha" class="form-label">Senha</label>
                                <input type="password" class="form-control" id="senha" name="senha" required>
                            </div>
                        </fieldset>
                        <div class="col-md-12">
                            <button class="btn btn-primary" type="submit">Entrar</button>
                        </div>
                    </form>
                </div>
            </body>
        </html>
    `);
});

// Processar login do usuário
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    // Aceitar qualquer usuário e senha fornecidos
    req.session.autenticado = true; // Marca a sessão como autenticada
    res.redirect('/menu'); // Direciona para o menu principal após login
});

// Página do menu principal (restrita a usuários autenticados)
app.get('/menu', verificarAutenticacao, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Menu Principal</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                ${montarMenu()}
                <div class="container mt-5">
                    <h2>Bem-vindo, ${usuarioArmazenado ? usuarioArmazenado.nome : 'visitante'}!</h2>
                    <p>Escolha uma das opções abaixo:</p>
                    <a href="/registrar" class="btn btn-secondary">Cadastrar Usuário</a>
                    <a href="/chat" class="btn btn-primary">Bate Papo</a>
                </div>
            </body>
        </html>
    `);
});

// Página de cadastro de usuários
app.get('/registrar', verificarAutenticacao, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cadastro de Usuário</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            ${montarMenu()}
            <div class="container mt-5">
                <h2>Cadastro de Usuário</h2>
                <form action="/registrar" method="POST">
                    <div class="mb-3">
                        <label for="nome" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="nome" name="nome" required>
                    </div>
                    <div class="mb-3">
                        <label for="dataNascimento" class="form-label">Data de Nascimento</label>
                        <input type="date" class="form-control" id="dataNascimento" name="dataNascimento" required>
                    </div>
                    <div class="mb-3">
                        <label for="nickname" class="form-label">Apelido</label>
                        <input type="text" class="form-control" id="nickname" name="nickname" required>
                    </div>
                    <button type="submit" class="btn btn-primary mt-3">Registrar</button>
                </form>
                <div class="mt-4">
                    <a href="/menu" class="btn btn-secondary">Voltar ao Menu</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Processar o registro de novos usuários
app.post('/registrar', (req, res) => {
    const { nome, dataNascimento, nickname } = req.body;

    // Validar dados
    const erros = {};
    if (!nome || nome.trim() === '') {
        erros.nome = 'O campo nome é obrigatório.';
    }
    if (!dataNascimento || dataNascimento.trim() === '') {
        erros.dataNascimento = 'O campo data de nascimento é obrigatório.';
    }
    if (!nickname || nickname.trim() === '') {
        erros.nickname = 'O campo nickname é obrigatório.';
    }

    if (Object.keys(erros).length > 0) {
        res.send(`
            <ul>
                ${Object.values(erros).map(erro => `<li>${erro}</li>`).join('')}
            </ul>
        `);
    } else {
        usuarioArmazenado = { nome, dataNascimento, nickname };
        res.redirect('/menu');  // Redireciona para o menu após o cadastro
    }
});

// Rota do chat (somente se autenticado)
app.get('/chat', verificarAutenticacao, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Chat</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                ${montarMenu()}
                <div class="container mt-5">
                    <h1>Bem-vindo ao Bate Papo</h1>
                    <form action="/chat" method="POST">
                        <input type="text" class="form-control" name="mensagem" placeholder="Digite sua mensagem..." required>
                        <button class="btn btn-primary mt-3" type="submit">Enviar</button>
                    </form>
                    <div id="mensagens">
                        ${mensagens.map(msg => `
                            <div class="alert alert-info mt-3">${msg}</div>
                        `).join('')}
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Processar mensagem do chat
app.post('/chat', verificarAutenticacao, (req, res) => {
    const { mensagem } = req.body;
    mensagens.push(mensagem);
    res.redirect('/chat');
});

// Iniciar servidor
app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
});
