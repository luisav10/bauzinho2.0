// login_cadastro_script.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const recuperarSenhaForm = document.getElementById('recuperar-senha-form');
    const authMessage = document.getElementById('auth-message');

    const showCadastroBtn = document.getElementById('show-cadastro-btn');
    const hideCadastroBtn = document.getElementById('hide-cadastro-btn');
    const showRecuperarSenhaBtn = document.getElementById('show-recuperar-senha-btn');
    const hideRecuperarSenhaBtn = document.getElementById('hide-recuperar-senha-btn');

    // --- Funções Auxiliares de Exibição de Formulários ---
    function showForm(formToShow) {
        loginForm.style.display = 'none';
        cadastroForm.style.display = 'none';
        recuperarSenhaForm.style.display = 'none';
        formToShow.style.display = 'flex'; // Usando flex para centralizar
        authMessage.textContent = ''; // Limpa mensagens anteriores
    }

    // --- Funções de Local Storage para Usuário Admin ---
    // Usamos btoa para uma codificação simples, NÃO É CRIPTOGRAFIA SEGURA PARA PRODUÇÃO
    function saveAdminUser(username, password) {
        try {
            localStorage.setItem('adminUser', username);
            localStorage.setItem('adminPass', btoa(password)); // Codifica em Base64
            return true;
        } catch (e) {
            console.error('Erro ao salvar usuário no localStorage:', e);
            return false;
        }
    }

    function getAdminUser() {
        const username = localStorage.getItem('adminUser');
        const password = localStorage.getItem('adminPass');
        return { username, password: password ? atob(password) : null }; // Decodifica Base64
    }

    function setLoggedInStatus(isLoggedIn) {
        localStorage.setItem('isMerendeiraLoggedIn', isLoggedIn ? 'true' : 'false');
    }

    // --- NOVO: Função de Validação de Senha ---
    function validatePassword(password) {
        // Expressão Regular:
        // ^                  -> Início da string
        // (?=.*[a-zA-Z])     -> Pelo menos uma letra (maiúscula ou minúscula)
        // (?=.*\d)           -> Pelo menos um número
        // [a-zA-Z0-9]{8,}    -> Apenas letras e números, e no mínimo 8 caracteres
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8,}$/;
        return passwordRegex.test(password);
    }

    // --- Lógica de Autenticação ---

    // 1. Cadastro de Usuário
    cadastroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('cadastro-usuario').value;
        const password = document.getElementById('cadastro-senha').value;
        const confirmPass = document.getElementById('confirmar-senha').value;

        // Validação da senha
        if (!validatePassword(password)) {
            authMessage.textContent = 'A senha deve ter no mínimo 8 caracteres e conter letras e números.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        if (password !== confirmPass) {
            authMessage.textContent = 'As senhas não coincidem.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        const existingUser = getAdminUser();
        if (existingUser.username) {
            authMessage.textContent = 'Já existe um usuário cadastrado. Por favor, faça login ou use a recuperação de senha.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        if (saveAdminUser(username, password)) {
            authMessage.textContent = 'Cadastro realizado com sucesso! Agora você pode fazer login.';
            authMessage.style.color = 'var(--accent-color)';
            cadastroForm.reset();
            showForm(loginForm);
        } else {
            authMessage.textContent = 'Erro ao cadastrar. Tente novamente.';
            authMessage.style.color = 'var(--error-red)';
        }
    });

    // 2. Login de Usuário
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-usuario').value;
        const password = document.getElementById('login-senha').value;

        const storedUser = getAdminUser();

        if (storedUser.username === username && storedUser.password === password) {
            setLoggedInStatus(true);
            authMessage.textContent = 'Login bem-sucedido! Redirecionando...';
            authMessage.style.color = 'var(--primary-color)';
            // Redireciona para o painel admin após o login
            window.location.href = 'admin.html';
        } else {
            authMessage.textContent = 'Usuário ou senha incorretos.';
            authMessage.style.color = 'var(--error-red)';
        }
    });

    // 3. Recuperação de Senha
    recuperarSenhaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('recuperar-usuario').value;
        const newPassword = document.getElementById('nova-senha').value;
        const confirmNewPassword = document.getElementById('confirmar-nova-senha').value;

        const storedUser = getAdminUser();

        if (storedUser.username !== username) {
            authMessage.textContent = 'Usuário não encontrado.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        // Validação da nova senha
        if (!validatePassword(newPassword)) {
            authMessage.textContent = 'A nova senha deve ter no mínimo 8 caracteres e conter letras e números.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        if (newPassword !== confirmNewPassword) {
            authMessage.textContent = 'A nova senha e a confirmação não coincidem.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        if (saveAdminUser(username, newPassword)) {
            authMessage.textContent = 'Senha alterada com sucesso! Faça login com a nova senha.';
            authMessage.style.color = 'var(--accent-color)';
            recuperarSenhaForm.reset();
            showForm(loginForm);
        } else {
            authMessage.textContent = 'Erro ao redefinir senha. Tente novamente.';
            authMessage.style.color = 'var(--error-red)';
        }
    });


    // --- Navegação entre Formulários ---
    showCadastroBtn.addEventListener('click', () => showForm(cadastroForm));
    hideCadastroBtn.addEventListener('click', () => showForm(loginForm));
    showRecuperarSenhaBtn.addEventListener('click', () => showForm(recuperarSenhaForm));
    hideRecuperarSenhaBtn.addEventListener('click', () => showForm(loginForm));

    // --- Inicialização: Verifica se já há um usuário cadastrado ---
    const storedUser = getAdminUser();
    if (storedUser.username) {
        showForm(loginForm); // Se já tem usuário, exibe o formulário de login
    } else {
        showForm(cadastroForm); // Se não tem usuário, exibe o formulário de cadastro
        authMessage.textContent = 'Bem-vindo(a)! Por favor, cadastre um usuário administrador.';
        authMessage.style.color = 'var(--primary-color)';
    }

    // Garante que o status de login seja "false" ao carregar a página de login/cadastro
    setLoggedInStatus(false);
});