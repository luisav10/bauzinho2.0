// admin_script.js

document.addEventListener('DOMContentLoaded', () => {
    const adminPanelSection = document.getElementById('admin-panel-section');

    // Elementos de gerenciamento de cardápio
    const addItemForm = document.getElementById('add-item-form');
    const cardapioListAdmin = document.getElementById('cardapio-list-admin');
    const turnosButtonsAdmin = document.querySelector('.turnos-buttons-admin');
    const currentActiveTurnoDisplay = document.getElementById('current-active-turno-display');
    // Adicione uma referência para o título de itens adicionados
    const sectionTitleText = cardapioListAdmin.querySelector('.section-title-text'); 
    const emptyListMessage = document.createElement('p'); // Criar um elemento para a mensagem de lista vazia
    emptyListMessage.textContent = 'Nenhum item no cardápio. Adicione novos itens acima!';
    emptyListMessage.classList.add('empty-list-message'); // Adicionar uma classe para estilização, se necessário

    // Elementos do relatório
    const relatorioContagemMerendeiraDiv = document.getElementById('relatorio-contagem-merendeira');
    let merendaChart; // Mantido, embora não haja lógica de gráfico aqui

    // Botão Finalizar Turno
    const finalizarTurnoBtn = document.getElementById('finalizar-turno-btn');

    // Botão Enviar Cardápio
    const enviarCardapioBtn = document.getElementById('enviar-cardapio-btn');

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

    // --- Funções de Autenticação (APENAS VERIFICAÇÃO DE STATUS) ---
    function isLoggedIn() {
        return localStorage.getItem('isMerendeiraLoggedIn') === 'true';
    }

    function performLogout() {
        localStorage.removeItem('isMerendeiraLoggedIn'); // Remove o status de login
        // Não redireciona aqui, o redirecionamento será feito no event listener do botão enviarCardapioBtn
    }

    // --- Gerenciamento do Cardápio ---
    function carregarCardapioAdmin() {
        // Encontra o elemento que lista os itens (excluindo o título)
        let itemListContainer = cardapioListAdmin.querySelector('.item-list-container');
        if (!itemListContainer) {
            itemListContainer = document.createElement('div');
            itemListContainer.classList.add('item-list-container');
            // Insere o container APÓS o título, se o título existir.
            // Caso contrário, insere como primeiro filho.
            if (sectionTitleText) {
                cardapioListAdmin.insertBefore(itemListContainer, sectionTitleText.nextSibling);
            } else {
                cardapioListAdmin.appendChild(itemListContainer);
            }
        }
        itemListContainer.innerHTML = ''; // Limpa APENAS a lista de itens, mantendo o título

        if (cardapioDoDia.length === 0) {
            itemListContainer.appendChild(emptyListMessage); // Adiciona a mensagem de lista vazia
            sectionTitleText.style.display = 'none'; // Esconde o título quando não há itens
        } else {
            if (emptyListMessage.parentNode) { // Remove a mensagem de lista vazia se ela existir
                emptyListMessage.parentNode.removeChild(emptyListMessage);
            }
            sectionTitleText.style.display = 'block'; // Mostra o título quando há itens
            cardapioDoDia.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('cardapio-item-admin');
                div.innerHTML = `
                    <span class="item-info">${item.nome} <span class="item-type">(${item.tipo === 'unidade' ? 'por unidade' : 'por porção'})</span></span>
                    <button class="delete-btn" data-id="${item.id}">Remover</button>
                `;
                itemListContainer.appendChild(div); // Adiciona ao container de itens
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
        // Modificado: Adicionado a classe 'report-number' ao <span> do numConfirmacoes
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
            // Modificado: Adicionado a classe 'report-number' ao <span> do count
            li.innerHTML = `${item.nome}: <strong><span class="report-number">${count}</span></strong> ${item.tipo === 'unidade' ? 'unidades' : 'porções'}`;
            ul.appendChild(li);
        });
        relatorioContagemMerendeiraDiv.appendChild(ul);
    }

    // Função para zerar dados ao mudar de turno
    function resetTurnoData() {
        localStorage.removeItem('bauMerendaContagem');
        localStorage.removeItem('bauMerendaNumConfirmacoes');
        localStorage.removeItem('cardapioDoDia');
        cardapioDoDia = [];
        contagemMerenda = {};
        numConfirmacoes = 0;
        carregarCardapioAdmin();
        carregarRelatorioMerendeira();
        saveAdminData(); // Salva os dados zerados
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

    // --- Event Listeners ---

    // Seleção de Turno diretamente na seção de gerenciamento
    turnosButtonsAdmin.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-turno-admin')) {
            const novoTurno = e.target.dataset.turno;

            if (novoTurno !== currentActiveTurno) { // Só reseta se o turno realmente mudar
                resetTurnoData(); // Zera os dados do turno anterior
                currentActiveTurno = novoTurno;
                localStorage.setItem('bauMerendaTurnoAtivo', currentActiveTurno);
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
            return; // Impede a adição se o turno não estiver selecionado
        }

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

    // Event listener: Enviar Cardápio (AGORA COM LOGOUT SILENCIOSO E REDIRECIONAMENTO)
    enviarCardapioBtn.addEventListener('click', () => {
        if (!currentActiveTurno || cardapioDoDia.length === 0) {
            alert('Por favor, selecione um turno e adicione itens ao cardápio antes de enviá-lo.');
            return;
        }
        saveAdminData(); // Garante que os dados mais recentes estejam salvos
        performLogout(); // Realiza o logout silenciosamente
        window.location.href = 'index.html'; // Redireciona para a página inicial
    });

    // Event listener para o botão Finalizar Turno
    finalizarTurnoBtn.addEventListener('click', () => {
        // Redireciona para a nova página, os dados já estão salvos e serão zerados ao mudar de turno
        window.location.href = 'finalizar_turno.html';
    });

    // --- Inicialização ---
    // Verifica o status de login ao carregar a página
    if (!isLoggedIn()) {
        window.location.href = 'login_cadastro.html'; // Redireciona se não estiver logado
        return; // Interrompe a execução do restante do script
    }

    loadAdminData();
    currentActiveTurnoDisplay.textContent = currentActiveTurno || 'Não definido'; // Atualiza o display do turno

    carregarCardapioAdmin(); // Carrega o cardápio (e o título)
    carregarRelatorioMerendeira();
    markActiveTurnoButton(); // Marca o botão de turno ativo na inicialização
});