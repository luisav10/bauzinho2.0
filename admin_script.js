// admin_script.js (Placeholder - POR FAVOR, SUBSTITUA PELA SUA VERSÃO REAL QUANDO TIVER)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const authSection = document.getElementById('auth-section');
    const adminPanelSection = document.getElementById('admin-panel-section');
    const turnoSelectionSection = document.getElementById('turno-selection-section');
    const showCadastroBtn = document.getElementById('show-cadastro-btn');
    const hideCadastroBtn = document.getElementById('hide-cadastro-btn');
    const authMessage = document.getElementById('auth-message');
    const logoutBtn = document.getElementById('logout-btn');

    // Elementos de gerenciamento de cardápio
    const addItemForm = document.getElementById('add-item-form');
    const cardapioListAdmin = document.getElementById('cardapio-list-admin');
    const changeTurnoBtn = document.getElementById('change-turno-btn');
    const turnosButtonsAdmin = document.querySelector('.turnos-buttons-admin');
    const currentActiveTurnoDisplay = document.getElementById('current-active-turno-display');

    // Elementos do relatório
    const relatorioContagemMerendeiraDiv = document.getElementById('relatorio-contagem-merendeira');
    const merendaChartCanvas = document.getElementById('merendaChart');
    let merendaChart; // Variável para a instância do Chart.js

    // NOVO: Botão Finalizar Turno
    const finalizarTurnoBtn = document.getElementById('finalizar-turno-btn');

    // --- Variáveis de Dados (persistência via localStorage) ---
    let cardapioDoDia = []; // Lista de objetos { id: ..., nome: ..., tipo: ... }
    let contagemMerenda = {}; // Objeto { itemId: count }
    let numConfirmacoes = 0; // Número total de confirmações de pratos
    let currentActiveTurno = '';

    // --- Funções de Local Storage ---
    function saveAdminData() {
        localStorage.setItem('cardapioDoDia', JSON.stringify(cardapioDoDia));
        localStorage.setItem('bauMerendaContagem', JSON.stringify(contagemMerenda));
        localStorage.setItem('bauMerendaNumConfirmacoes', numConfirmacoes.toString());
        localStorage.setItem('bauMerendaTurnoAtivo', currentActiveTurno);
    }

    function loadAdminData() {
        try {
            cardapioDoDia = JSON.parse(localStorage.getItem('cardapioDoDia') || '[]');
            contagemMerenda = JSON.parse(localStorage.getItem('bauMerendaContagem') || '{}');
            numConfirmacoes = parseInt(localStorage.getItem('bauMerendaNumConfirmacoes') || '0');
            currentActiveTurno = localStorage.getItem('bauMerendaTurnoAtivo') || '';
        } catch (e) {
            console.error('Erro ao carregar dados do localStorage:', e);
            // Se houver erro, zera tudo para evitar problemas
            cardapioDoDia = [];
            contagemMerenda = {};
            numConfirmacoes = 0;
            currentActiveTurno = '';
        }
    }

    // --- Funções de Autenticação (SIMPLES, PARA PROTÓTIPO - NÃO SEGURO PARA PRODUÇÃO) ---
    function saveUser(username, password) {
        localStorage.setItem('adminUser', username);
        localStorage.setItem('adminPass', btoa(password)); // Codifica em Base64
    }

    function checkLogin(username, password) {
        const savedUser = localStorage.getItem('adminUser');
        const savedPass = localStorage.getItem('adminPass');
        return savedUser === username && savedPass === btoa(password);
    }

    function isLoggedIn() {
        return localStorage.getItem('isMerendeiraLoggedIn') === 'true';
    }

    function loginSuccess() {
        localStorage.setItem('isMerendeiraLoggedIn', 'true');
        authSection.style.display = 'none';
        if (currentActiveTurno) { // Se já tiver um turno ativo salvo
            turnoSelectionSection.style.display = 'none';
            adminPanelSection.style.display = 'flex';
            currentActiveTurnoDisplay.textContent = currentActiveTurno;
            carregarCardapioAdmin();
            carregarRelatorioMerendeira();
            renderizarGrafico();
        } else { // Se não tiver turno ativo, mostra a seleção de turno
            turnoSelectionSection.style.display = 'block';
            currentActiveTurnoDisplay.textContent = 'Não definido';
        }
    }

    function logout() {
        localStorage.removeItem('isMerendeiraLoggedIn');
        localStorage.removeItem('bauMerendaTurnoAtivo'); // Limpa o turno ativo ao deslogar
        localStorage.removeItem('cardapioDoDia'); // Limpa o cardápio
        localStorage.removeItem('bauMerendaContagem'); // Limpa a contagem
        localStorage.removeItem('bauMerendaNumConfirmacoes'); // Limpa o número de confirmações
        window.location.reload(); // Recarrega a página para voltar à tela de login
    }

    // --- Gerenciamento do Cardápio ---
    function carregarCardapioAdmin() {
        cardapioListAdmin.innerHTML = '';
        if (cardapioDoDia.length === 0) {
            cardapioListAdmin.innerHTML = '<p>Nenhum item no cardápio. Adicione novos itens acima!</p>';
            return;
        }
        cardapioDoDia.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('cardapio-item-admin');
            div.innerHTML = `
                <span class="item-info">${item.nome} <span class="item-type">(${item.tipo === 'unidade' ? 'por unidade' : 'por porção'})</span></span>
                <button class="delete-btn" data-id="${item.id}">Remover</button>
            `;
            cardapioListAdmin.appendChild(div);
        });
        addDeleteListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll('.cardapio-item-admin .delete-btn').forEach(button => {
            button.onclick = (event) => {
                const itemId = event.target.dataset.id;
                cardapioDoDia = cardapioDoDia.filter(item => item.id !== itemId);
                // Opcional: Remover o item da contagem também, se ele for removido do cardápio.
                // delete contagemMerenda[itemId];
                saveAdminData();
                carregarCardapioAdmin();
            };
        });
    }

    // --- Relatório e Gráfico ---
    function carregarRelatorioMerendeira() {
        relatorioContagemMerendeiraDiv.innerHTML = '';
        relatorioContagemMerendeiraDiv.innerHTML += `<p>Total de pratos confirmados neste turno: <strong><span>${numConfirmacoes}</span></strong></p>`;
        relatorioContagemMerendeiraDiv.innerHTML += `<p>Contagem por item:</p>`;
        
        if (Object.keys(contagemMerenda).length === 0) {
            relatorioContagemMerendeiraDiv.innerHTML += '<p>Nenhum item de merenda foi selecionado ainda.</p>';
            return;
        }

        const ul = document.createElement('ul');
        cardapioDoDia.forEach(item => {
            const count = contagemMerenda[item.id] || 0;
            const li = document.createElement('li');
            li.innerHTML = `${item.nome}: <strong><span>${count}</span></strong> ${item.tipo === 'unidade' ? 'unidades' : 'porções'}`;
            ul.appendChild(li);
        });
        relatorioContagemMerendeiraDiv.appendChild(ul);
    }

    function renderizarGrafico() {
        if (merendaChart) {
            merendaChart.destroy(); // Destrói o gráfico anterior se existir
        }

        const labels = cardapioDoDia.map(item => item.nome);
        const data = cardapioDoDia.map(item => contagemMerenda[item.id] || 0);

        merendaChart = new Chart(merendaChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantidade Consumida',
                    data: data,
                    backgroundColor: [
                        'rgba(142, 90, 54, 0.7)', // primary-color
                        'rgba(192, 140, 99, 0.7)', // secondary-color
                        'rgba(124, 159, 89, 0.7)', // accent-color
                        'rgba(184, 134, 11, 0.7)' // gold-accent
                    ],
                    borderColor: [
                        'rgba(142, 90, 54, 1)',
                        'rgba(192, 140, 99, 1)',
                        'rgba(124, 159, 89, 1)',
                        'rgba(184, 134, 11, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { if (value % 1 === 0) return value; } // Apenas inteiros
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de Merenda por Item'
                    }
                }
            }
        });
    }

    // --- Event Listeners ---

    // Autenticação
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-usuario').value;
        const password = document.getElementById('login-senha').value;

        if (checkLogin(username, password)) {
            authMessage.textContent = '';
            loginSuccess();
        } else {
            authMessage.textContent = 'Usuário ou senha incorretos.';
            authMessage.style.color = 'var(--error-red)';
        }
    });

    cadastroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('cadastro-usuario').value;
        const password = document.getElementById('cadastro-senha').value;
        const confirmPass = document.getElementById('confirmar-senha').value;

        if (password !== confirmPass) {
            authMessage.textContent = 'As senhas não coincidem.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }
        if (localStorage.getItem('adminUser')) {
            authMessage.textContent = 'Já existe um usuário cadastrado. Use a tela de login.';
            authMessage.style.color = 'var(--error-red)';
            return;
        }

        saveUser(username, password);
        authMessage.textContent = 'Cadastro realizado com sucesso! Faça login.';
        authMessage.style.color = 'var(--accent-color)';
        cadastroForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    showCadastroBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        cadastroForm.style.display = 'flex';
        authMessage.textContent = '';
    });

    hideCadastroBtn.addEventListener('click', () => {
        cadastroForm.style.display = 'none';
        loginForm.style.display = 'flex';
        authMessage.textContent = '';
    });

    logoutBtn.addEventListener('click', logout);

    // Seleção de Turno
    turnosButtonsAdmin.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-turno-admin')) {
            currentActiveTurno = e.target.dataset.turno;
            localStorage.setItem('bauMerendaTurnoAtivo', currentActiveTurno);
            currentActiveTurnoDisplay.textContent = currentActiveTurno;

            // Remove a classe 'active' de todos e adiciona ao clicado
            document.querySelectorAll('.btn-turno-admin').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Exibe o painel de administração e esconde a seleção de turno
            turnoSelectionSection.style.display = 'none';
            adminPanelSection.style.display = 'flex';
            carregarCardapioAdmin();
            carregarRelatorioMerendeira();
            renderizarGrafico();
            saveAdminData(); // Salva o turno ativo
        }
    });

    changeTurnoBtn.addEventListener('click', () => {
        // Zera os dados e volta para a seleção de turno
        localStorage.removeItem('bauMerendaContagem');
        localStorage.removeItem('bauMerendaNumConfirmacoes');
        localStorage.removeItem('cardapioDoDia'); // Também zera o cardápio
        currentActiveTurno = ''; // Limpa o turno ativo
        localStorage.removeItem('bauMerendaTurnoAtivo'); // Limpa o turno no localStorage
        
        cardapioDoDia = []; // Reinicia o cardápio em memória
        contagemMerenda = {};
        numConfirmacoes = 0;

        adminPanelSection.style.display = 'none';
        turnoSelectionSection.style.display = 'block';
        currentActiveTurnoDisplay.textContent = 'Não definido';
        carregarCardapioAdmin(); // Atualiza a lista do cardápio (vazia)
        carregarRelatorioMerendeira(); // Atualiza o relatório (vazio)
        if (merendaChart) merendaChart.destroy(); // Destrói o gráfico
    });

    // Adicionar item ao cardápio
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemName = document.getElementById('item-nome').value;
        const itemType = document.getElementById('item-tipo').value;
        const newItem = {
            id: Date.now().toString(), // ID único baseado no timestamp
            nome: itemName,
            tipo: itemType
        };
        cardapioDoDia.push(newItem);
        saveAdminData();
        carregarCardapioAdmin();
        addItemForm.reset(); // Limpa o formulário
    });

    // NOVO: Event listener para o botão Finalizar Turno
    finalizarTurnoBtn.addEventListener('click', () => {
        window.location.href = 'finalizar_turno.html'; // Redireciona para a nova página
    });

    // --- Inicialização ---
    loadAdminData();
    if (isLoggedIn()) {
        loginSuccess(); // Tenta fazer login automaticamente se já estiver logado
    } else {
        authSection.style.display = 'block';
    }

    // Se o turno ativo existir no localStorage, marcar o botão correspondente como ativo
    if (currentActiveTurno) {
        document.querySelectorAll('.btn-turno-admin').forEach(btn => {
            if (btn.dataset.turno === currentActiveTurno) {
                btn.classList.add('active');
            }
        });
    }
});