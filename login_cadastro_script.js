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

    // --- Funções de Local Storage para Usuários Admin (AGORA MÚLTIPLOS) ---
    // Usamos btoa para uma codificação simples, NÃO É CRIPTOGRAFIA SEGURA PARA PRODUÇÃO
    
    /**
     * Obtém a lista de usuários armazenada no localStorage.
     * Retorna um array vazio se não houver usuários.
     */
    function getUsers() {
        try {
            const usersJson = localStorage.getItem('adminUsers');
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (e) {
            console.error('Erro ao ler usuários do localStorage:', e);
            return [];
        }
    }

    /**
     * Salva a lista completa de usuários no localStorage.
     */
    function saveUsers(users) {
        try {
            localStorage.setItem('adminUsers', JSON.stringify(users));
            return true;
        } catch (e) {
            console.error('Erro ao salvar usuários no localStorage:', e);
            return false;
        }
    }

    // --- NOVO: Função de Validação de Senha ---
    function validatePassword(password) {
        // Expressão Regular:
        // ^                 -> Início da string
        // (?=.*[a-zA-Z])    -> Pelo menos uma letra (maiúscula ou minúscula)
        // (?=.*\d)          -> Pelo menos um número
        // [a-zA-Z0-9]{8,}   -> Apenas letras e números, e no mínimo 8 caracteres
        // $                 -> Fim da string
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8,}$/;
        return passwordRegex.test(password);
    }

    function setLoggedInStatus(isLoggedIn) {
        localStorage.setItem('isMerendeiraLoggedIn', isLoggedIn ? 'true' : 'false');
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

        let users = getUsers();
        // Verifica se o usuário já existe na lista
        const userExists = users.some(user => user.username === username);

        if (userExists) {
            authMessage.textContent = 'Este nome de usuário já está em uso. Escolha outro.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        // Adiciona o novo usuário à lista
        users.push({ username: username, password: btoa(password) }); // Codifica a senha

        if (saveUsers(users)) {
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

        const users = getUsers();
        // Procura pelo usuário e valida a senha
        const foundUser = users.find(user => 
            user.username === username && atob(user.password) === password
        );

        if (foundUser) {
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

        let users = getUsers();
        // Encontra o índice do usuário na lista
        const userIndex = users.findIndex(user => user.username === username);

        if (userIndex === -1) {
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

        // Atualiza a senha do usuário na lista
        users[userIndex].password = btoa(newPassword);

        if (saveUsers(users)) {
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

    // --- Inicialização: Verifica se já há usuários cadastrados ---
    const existingUsers = getUsers();
    if (existingUsers.length > 0) {
        showForm(loginForm); // Se já tem usuários, exibe o formulário de login
    } else {
        showForm(cadastroForm); // Se não tem usuários, exibe o formulário de cadastro
        authMessage.textContent = 'Bem-vindo(a)! Por favor, cadastre seu primeiro usuário administrador.';
        authMessage.style.color = 'var(--primary-color)';
    }

    // Garante que o status de login seja "false" ao carregar a página de login/cadastro
    setLoggedInStatus(false);
});