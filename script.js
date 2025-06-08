// script.js (Para a página do Aluno - index.html)

document.addEventListener('DOMContentLoaded', () => {
    const cardapioItensDiv = document.getElementById('cardapio-itens-aluno');
    const confirmarEscolhaBtn = document.getElementById('confirmar-escolha-aluno');
    const currentDateSpan = document.getElementById('current-date');
    const currentTimeSpan = document.getElementById('current-time');
    const activeTurnoSpan = document.getElementById('active-turno');
    const confirmationPopup = document.getElementById('confirmation-popup'); // Referência ao pop-up

    // --- Funções Auxiliares de Pop-up ---
    function showConfirmationPopup() {
        confirmationPopup.classList.add('show');
        setTimeout(() => {
            confirmationPopup.classList.remove('show');
        }, 2000); // TEMPO ALTERADO AQUI PARA 2 SEGUNDOS
    }

    // --- Funções de Data e Hora e Turno Ativo ---
    function updateDateTimeAndTurno() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        currentDateSpan.textContent = now.toLocaleDateString('pt-BR', dateOptions);
        currentTimeSpan.textContent = now.toLocaleTimeString('pt-BR', timeOptions);

        // Carrega o turno ativo definido pela merendeira
        const currentActiveTurno = localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido';
        activeTurnoSpan.textContent = ` ${currentActiveTurno}`;
    }
    setInterval(updateDateTimeAndTurno, 1000); // Atualiza a cada segundo
    updateDateTimeAndTurno(); // Chama uma vez para exibir imediatamente

    // --- Funções de Local Storage para Merenda ---
    function loadMerendaData() {
        let contagemMerenda = {};
        let numConfirmacoes = 0;
        try {
            const savedContagem = localStorage.getItem('bauMerendaContagem');
            if (savedContagem) {
                contagemMerenda = JSON.parse(savedContagem);
            }
            const savedNumConfirmacoes = localStorage.getItem('bauMerendaNumConfirmacoes');
            if (savedNumConfirmacoes) {
                numConfirmacoes = parseInt(savedNumConfirmacoes);
            }
        } catch (e) {
            console.error('Erro ao carregar dados do localStorage para merenda:', e);
        }
        return { contagemMerenda, numConfirmacoes };
    }

    function saveMerendaData(contagemMerenda, numConfirmacoes) {
        try {
            localStorage.setItem('bauMerendaContagem', JSON.stringify(contagemMerenda));
            localStorage.setItem('bauMerendaNumConfirmacoes', numConfirmacoes.toString());
            console.log('Dados de merenda salvos no localStorage.');
        } catch (e) {
            console.error('Erro ao salvar dados de merenda no localStorage:', e);
        }
    }

    function getCardapioFromLocalStorage() {
        try {
            const savedCardapio = localStorage.getItem('cardapioDoDia');
            return savedCardapio ? JSON.parse(savedCardapio) : [];
        } catch (e) {
            console.error('Erro ao carregar cardápio do localStorage:', e);
            return [];
        }
    }

    // --- Funções da Interface do Usuário ---
    function carregarCardapioAluno() {
        const cardapioDoDia = getCardapioFromLocalStorage();
        cardapioItensDiv.innerHTML = ''; // Limpa o conteúdo antes de recarregar

        if (cardapioDoDia.length === 0) {
            cardapioItensDiv.innerHTML = '<p class="info-message">Nenhum item de merenda disponível para hoje. Por favor, aguarde as merendeiras atualizarem o cardápio!</p>';
            confirmarEscolhaBtn.disabled = true; // Desabilita o botão se não houver itens
            confirmarEscolhaBtn.classList.add('disabled'); // Adiciona classe para estilo de desabilitado
            return;
        } else {
            confirmarEscolhaBtn.disabled = false;
            confirmarEscolhaBtn.classList.remove('disabled');
        }

        cardapioDoDia.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('item-merenda-chic');
            card.dataset.id = item.id;

            // Remove a tag <img> e foca apenas no nome do item
            card.innerHTML = `<p>${item.nome}</p>`;

            if (item.tipo === 'unidade') {
                const quantityControl = document.createElement('div');
                quantityControl.classList.add('quantity-control');
                quantityControl.innerHTML = `
                    <button class="quantity-btn decrease-btn" data-item-id="${item.id}">-</button>
                    <span class="item-quantity" id="quantity-${item.id}">0</span>
                    <button class="quantity-btn increase-btn" data-item-id="${item.id}">+</button>
                `;
                card.appendChild(quantityControl);

                quantityControl.querySelector('.increase-btn').addEventListener('click', (event) => {
                    event.stopPropagation();
                    const itemId = event.target.dataset.itemId;
                    const quantitySpan = document.getElementById(`quantity-${itemId}`);
                    let currentQuantity = parseInt(quantitySpan.textContent);
                    currentQuantity++;
                    quantitySpan.textContent = currentQuantity;
                    card.classList.add('selected');
                });

                quantityControl.querySelector('.decrease-btn').addEventListener('click', (event) => {
                    event.stopPropagation();
                    const itemId = event.target.dataset.itemId;
                    const quantitySpan = document.getElementById(`quantity-${itemId}`);
                    let currentQuantity = parseInt(quantitySpan.textContent);
                    if (currentQuantity > 0) {
                        currentQuantity--;
                        quantitySpan.textContent = currentQuantity;
                        if (currentQuantity === 0) {
                            card.classList.remove('selected');
                        }
                    }
                });
            } else {
                card.addEventListener('click', () => toggleSelecaoMerenda(card, item.id));
            }
            cardapioItensDiv.appendChild(card);
        });
    }

    function toggleSelecaoMerenda(card, itemId) {
        card.classList.toggle('selected');
    }

    // --- Eventos ---
    confirmarEscolhaBtn.addEventListener('click', () => {
        let { contagemMerenda, numConfirmacoes } = loadMerendaData();
        const cardapioDoDia = getCardapioFromLocalStorage();
        let totalItensEscolhidos = 0;

        cardapioDoDia.forEach(item => {
            if (item.tipo === 'unidade') {
                const quantitySpan = document.getElementById(`quantity-${item.id}`);
                if (quantitySpan) {
                    const quantity = parseInt(quantitySpan.textContent);
                    if (quantity > 0) {
                        if (contagemMerenda[item.id]) {
                            contagemMerenda[item.id] += quantity;
                        } else {
                            contagemMerenda[item.id] = quantity;
                        }
                        totalItensEscolhidos += quantity;
                    }
                }
            } else {
                const card = document.querySelector(`.item-merenda-chic[data-id="${item.id}"]`);
                if (card && card.classList.contains('selected')) {
                    if (contagemMerenda[item.id]) {
                        contagemMerenda[item.id]++;
                    } else {
                        contagemMerenda[item.id] = 1;
                    }
                    totalItensEscolhidos++;
                }
            }
        });

        if (totalItensEscolhidos > 0) {
            numConfirmacoes++;
            saveMerendaData(contagemMerenda, numConfirmacoes);

            // Exibe o pop-up
            showConfirmationPopup();

            // Reinicia a seleção e quantidades para a próxima vez
            document.querySelectorAll('.item-merenda-chic').forEach(card => {
                card.classList.remove('selected');
            });
            document.querySelectorAll('.item-quantity').forEach(span => {
                span.textContent = '0';
            });
            // Não é necessário recarregar o cardápio, apenas limpar a seleção atual
            // carregarCardapioAluno(); // Descomente se precisar recarregar todo o cardápio
        } else {
            alert('Por favor, selecione ao menos um item da merenda ou defina a quantidade.');
        }
    });

    // --- Inicialização ---
    carregarCardapioAluno();

    // Adiciona um listener para atualizar o cardápio e o turno caso a merendeira mude
    window.addEventListener('storage', (event) => {
        if (event.key === 'cardapioDoDia' || event.key === 'bauMerendaTurnoAtivo') {
            console.log('Dados atualizados pela merendeira, recarregando...');
            carregarCardapioAluno();
            updateDateTimeAndTurno();
        }
    });
});