// admin_script.js

document.addEventListener('DOMContentLoaded', () => {
    const adminPanelSection = document.getElementById('admin-panel-section');

    // Elementos de gerenciamento de cardápio
    const cardapioManagementControls = document.getElementById('cardapio-management-controls'); // Novo container para os controles
    const addItemForm = document.getElementById('add-item-form');
    const cardapioListAdmin = document.getElementById('cardapio-list-admin');
    const turnosButtonsAdminContainer = document.getElementById('turnos-buttons-admin-container'); // Agora com ID
    const currentActiveTurnoDisplay = document.getElementById('current-active-turno-display');
    const sectionTitleText = cardapioListAdmin.querySelector('.section-title-text');
    const emptyListMessage = document.createElement('p');
    emptyListMessage.textContent = 'Nenhum item no cardápio. Adicione novos itens acima!';
    emptyListMessage.classList.add('empty-list-message');

    // Elementos do relatório
    const relatorioContagemMerendeiraDiv = document.getElementById('relatorio-contagem-merendeira');
    let merendaChart;

    // Botões e mensagens do novo sistema de turno ativo
    const turnoAtivoDisplay = document.getElementById('turno-ativo-display'); // Mensagem "Turno X está ativo"
    const turnoAtivoMessageText = document.getElementById('turno-ativo-message-text'); // Onde o texto da mensagem vai
    const finalizarTurnoBtnInner = document.getElementById('finalizar-turno-btn-inner'); // Botão "Finalizar Turno" dentro da mensagem

    // Botão Enviar Cardápio
    const enviarCardapioBtn = document.getElementById('enviar-cardapio-btn');

    // --- Variáveis de Dados (persistência via localStorage) ---
    let cardapioDoDia = [];
    let contagemMerenda = {};
    let numConfirmacoes = 0;
    let currentActiveTurno = '';

    // --- Funções de Local Storage ---
    function saveAdminData() {
        localStorage.setItem('cardapioDoDia', JSON.stringify(cardapioDoDia));
        localStorage.setItem('bauMerendaContagem', JSON.stringify(contagemMerenda));
        localStorage.setItem('bauMerendaNumConfirmacoes', numConfirmacoes.toString());
        // ESSENCIAL: SALVA O TURNO ATIVO AO ENVIAR CARDÁPIO OU SELECIONAR UM
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
            cardapioDoDia = [];
            contagemMerenda = {};
            numConfirmacoes = 0;
            currentActiveTurno = '';
        }
    }

    // --- Funções de Autenticação (APENAS VERIFICAÇÃO DE STATUS) ---
    function isLoggedIn() {
        return localStorage.getItem('isMerendeiraLoggedIn') === 'true';
    }

    function performLogout() {
        localStorage.removeItem('isMerendeiraLoggedIn');
    }

    // --- Gerenciamento do Cardápio ---
    function carregarCardapioAdmin() {
        let itemListContainer = cardapioListAdmin.querySelector('.item-list-container');
        if (!itemListContainer) {
            itemListContainer = document.createElement('div');
            itemListContainer.classList.add('item-list-container');
            if (sectionTitleText) {
                cardapioListAdmin.insertBefore(itemListContainer, sectionTitleText.nextSibling);
            } else {
                cardapioListAdmin.appendChild(itemListContainer);
            }
        }
        itemListContainer.innerHTML = '';

        if (cardapioDoDia.length === 0) {
            itemListContainer.appendChild(emptyListMessage);
            sectionTitleText.style.display = 'none';
        } else {
            if (emptyListMessage.parentNode) {
                emptyListMessage.parentNode.removeChild(emptyListMessage);
            }
            sectionTitleText.style.display = 'block';
            cardapioDoDia.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('cardapio-item-admin');
                div.innerHTML = `
                    <span class="item-info">${item.nome} <span class="item-type">(${item.tipo === 'unidade' ? 'por unidade' : 'por porção'})</span></span>
                    <button class="delete-btn" data-id="${item.id}">Remover</button>
                `;
                itemListContainer.appendChild(div);
            });
        }
        addDeleteListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll('.cardapio-item-admin .delete-btn').forEach(button => {
            button.onclick = (event) => {
                const itemId = event.target.dataset.id;
                cardapioDoDia = cardapioDoDia.filter(item => item.id !== itemId);
                saveAdminData();
                carregarCardapioAdmin();
            };
        });
    }

    // --- Relatório ---
    function carregarRelatorioMerendeira() {
        relatorioContagemMerendeiraDiv.innerHTML = '';
        relatorioContagemMerendeiraDiv.innerHTML += `<p>Total de pratos confirmados neste turno: <strong><span class="report-number">${numConfirmacoes}</span></strong></p>`;
        relatorioContagemMerendeiraDiv.innerHTML += `<p>Contagem por item:</p>`;

        if (Object.keys(contagemMerenda).length === 0) {
            relatorioContagemMerendeiraDiv.innerHTML += '<p>Nenhum item de merenda foi selecionado ainda.</p>';
            return;
        }

        const ul = document.createElement('ul');
        cardapioDoDia.forEach(item => {
            const count = contagemMerenda[item.id] || 0;
            const li = document.createElement('li');
            li.innerHTML = `${item.nome}: <strong><span class="report-number">${count}</span></strong> ${item.tipo === 'unidade' ? 'unidades' : 'porções'}`;
            ul.appendChild(li);
        });
        relatorioContagemMerendeiraDiv.appendChild(ul);
    }

    // Função para zerar dados ao finalizar turno
    function clearTurnoData() {
        localStorage.removeItem('bauMerendaContagem');
        localStorage.removeItem('bauMerendaNumConfirmacoes');
        localStorage.removeItem('cardapioDoDia');
        localStorage.removeItem('bauMerendaTurnoAtivo'); // Limpa o turno ativo também!
        cardapioDoDia = [];
        contagemMerenda = {};
        numConfirmacoes = 0;
        currentActiveTurno = ''; // Reseta a variável local
        saveAdminData(); // Salva os dados zerados
        carregarCardapioAdmin();
        carregarRelatorioMerendeira();
    }

    // Função para marcar o botão de turno ativo
    function markActiveTurnoButton() {
        document.querySelectorAll('.btn-turno-admin').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.turno === currentActiveTurno) {
                btn.classList.add('active');
            }
        });
    }

    // --- Gerenciamento da UI do Turno Ativo (AGORA LÊ O ESTADO AO CARREGAR) ---
    function showActiveTurnoState() {
        if (currentActiveTurno) {
            turnoAtivoMessageText.innerHTML = `O turno da <strong>${currentActiveTurno}</strong> está ativo. Para iniciar um novo turno, clique em 'Finalizar Turno'.`;
            turnoAtivoDisplay.style.display = 'block'; // Mostra a mensagem e o botão Finalizar Turno
            cardapioManagementControls.style.display = 'none'; // Esconde os controles de criação de cardápio
            // O botão "Finalizar Turno" original não existe mais ou está escondido por CSS
        } else {
            turnoAtivoDisplay.style.display = 'none'; // Esconde a mensagem
            cardapioManagementControls.style.display = 'block'; // Mostra os controles de criação de cardápio
        }
    }

    // --- Event Listeners ---

    // Seleção de Turno diretamente na seção de gerenciamento
    turnosButtonsAdminContainer.addEventListener('click', (e) => { // Usando o container com ID
        if (e.target.classList.contains('btn-turno-admin')) {
            const novoTurno = e.target.dataset.turno;

            if (novoTurno !== currentActiveTurno) { // Só reseta se o turno realmente mudar
                // Não zera os dados aqui, apenas define o turno
                currentActiveTurno = novoTurno;
                currentActiveTurnoDisplay.textContent = currentActiveTurno;
                markActiveTurnoButton(); // Marca o botão de turno ativo
                saveAdminData(); // Salva o novo turno ativo
            }
        }
    });

    // Adicionar item ao cardápio
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemName = document.getElementById('item-nome').value;
        const itemType = document.getElementById('item-tipo').value;

        if (!currentActiveTurno) {
            alert('Por favor, selecione o turno que você está gerenciando antes de adicionar itens ao cardápio.');
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            nome: itemName,
            tipo: itemType
        };
        cardapioDoDia.push(newItem);
        saveAdminData();
        carregarCardapioAdmin();
        addItemForm.reset();
    });

    // Event listener: Enviar Cardápio (SALVA ESTADO E REDIRECIONA PARA INDEX.HTML COM LOGOUT)
    enviarCardapioBtn.addEventListener('click', () => {
        if (!currentActiveTurno) {
            alert('Por favor, selecione um turno antes de enviar o cardápio.');
            return;
        }
        if (cardapioDoDia.length === 0) {
            alert('Por favor, adicione itens ao cardápio antes de enviá-lo.');
            return;
        }
        saveAdminData(); // Garante que os dados mais recentes estejam salvos
        performLogout(); // Realiza o logout silenciosamente
        window.location.href = 'index.html'; // Redireciona para a página inicial
    });

    // Event listener para o botão Finalizar Turno (interno)
    finalizarTurnoBtnInner.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja finalizar o turno atual? Isso zerará todos os dados do relatório.')) {
            clearTurnoData(); // Zera os dados do turno
            showActiveTurnoState(); // Atualiza a UI para o estado "sem turno ativo"
            window.location.href = 'finalizar_turno.html'; // Mantém o redirecionamento
        }
    });

    // --- Inicialização ---
    if (!isLoggedIn()) {
        window.location.href = 'login_cadastro.html';
        return;
    }

    loadAdminData();
    currentActiveTurnoDisplay.textContent = currentActiveTurno || 'Não definido';

    carregarCardapioAdmin();
    carregarRelatorioMerendeira();
    markActiveTurnoButton();

    // Chama a função para configurar a UI com base no estado do turno ativo ao carregar a página
    showActiveTurnoState();
});