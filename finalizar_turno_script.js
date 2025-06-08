// finalizar_turno_script.js

document.addEventListener('DOMContentLoaded', () => {
    const gerarRelatorioPdfBtn = document.getElementById('gerar-relatorio-pdf-final');
    // Note: O botão 'cancelar-finalizar-btn' não existe no finalizar_turno.html que você enviou.
    // Ele existe como um 'a' tag com classe 'btn-chic secondary-outline'.
    // Vou usar a referência ao 'a' tag.
    const voltarAoPainelBtn = document.querySelector('a[href="admin.html"]'); // Corrigido para admin.html

    const relatorioFinalDisplay = document.getElementById('relatorio-final-display');
    const reportTextContentDiv = document.getElementById('report-text-content');
    const finalMerendaChartCanvas = document.getElementById('finalMerendaChart');
    let finalMerendaChartInstance; // Para armazenar a instância do gráfico

    // --- Função para mostrar o pop-up (Consolidada e única) ---
    function showConfirmationPopup() {
        const confirmationPopup = document.getElementById('confirmation-popup'); // Assumindo que você adicionará este pop-up no HTML, se necessário
        if (confirmationPopup) {
            confirmationPopup.classList.add('show');
            setTimeout(() => {
                confirmationPopup.classList.remove('show');
            }, 3000); // O pop-up desaparece após 3 segundos
        } else {
            console.warn("Elemento 'confirmation-popup' não encontrado. O pop-up não será exibido.");
        }
    }

    // --- Função para carregar e exibir o relatório antes de gerar o PDF ---
    function loadAndDisplayReport() {
        const contagemMerenda = JSON.parse(localStorage.getItem('bauMerendaContagem') || '{}');
        const numConfirmacoes = parseInt(localStorage.getItem('bauMerendaNumConfirmacoes') || '0');
        const cardapioDoDia = JSON.parse(localStorage.getItem('cardapioDoDia') || '[]');
        const turnoAtivo = localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido';

        // Constrói o HTML para a parte textual do relatório
        let reportHtml = `<h3>Resumo do Turno: ${turnoAtivo}</h3>`;
        reportHtml += `<p>Total de confirmações de pratos: <strong>${numConfirmacoes}</strong></p>`;
        reportHtml += `<p><strong>Detalhes dos Itens Consumidos:</strong></p>`;
        
        if (Object.keys(contagemMerenda).length > 0) {
            reportHtml += '<ul>';
            cardapioDoDia.forEach(item => {
                const count = contagemMerenda[item.id] || 0;
                if (count > 0) {
                    reportHtml += `<li>${item.nome}: <strong>${count}</strong> ${item.tipo === 'unidade' ? 'unidades' : 'porções'}</li>`;
                }
            });
            reportHtml += '</ul>';
        } else {
            reportHtml += '<p>Nenhum item consumido neste turno.</p>';
        }

        // Insere o conteúdo textual na div específica
        reportTextContentDiv.innerHTML = reportHtml;

        // Renderiza o gráfico após exibir o texto
        renderFinalChart(cardapioDoDia, contagemMerenda);
    }

    // --- Função para renderizar o gráfico Chart.js ---
    function renderFinalChart(cardapioData, consumptionData) {
        if (finalMerendaChartInstance) {
            finalMerendaChartInstance.destroy(); // Destroi o gráfico anterior se existir
        }

        const labels = cardapioData.map(item => item.nome);
        const data = cardapioData.map(item => consumptionData[item.id] || 0);

        finalMerendaChartInstance = new Chart(finalMerendaChartCanvas, {
            type: 'bar', // Gráfico de barras é bom para quantidades
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantidade Consumida',
                    data: data,
                    backgroundColor: [
                        'rgba(142, 90, 54, 0.7)',
                        'rgba(192, 140, 99, 0.7)',
                        'rgba(124, 159, 89, 0.7)',
                        'rgba(184, 134, 11, 0.7)'
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
                maintainAspectRatio: false, // Importante para o contêiner com altura fixa
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

    // Chama a função para exibir o relatório e renderizar o gráfico ao carregar a página
    loadAndDisplayReport();

    // --- Evento para gerar o PDF e zerar os dados ---
    if (gerarRelatorioPdfBtn) {
        gerarRelatorioPdfBtn.addEventListener('click', async () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Oculta os botões para não aparecerem no PDF
            gerarRelatorioPdfBtn.style.display = 'none';
            if (voltarAoPainelBtn) { // Verifica se o botão existe antes de tentar ocultar
                voltarAoPainelBtn.style.display = 'none';
            }

            // Obtém a data e hora atuais
            const now = new Date();
            const dateString = now.toLocaleDateString('pt-BR');
            const timeString = now.toLocaleTimeString('pt-BR');

            // Adiciona um título, data e horário ao PDF
            doc.setFontSize(22);
            doc.text("Relatório de Merenda - Baú da Merenda Digital", 105, 20, null, null, "center");
            doc.setFontSize(12);
            doc.text(`Data: ${dateString}`, 105, 30, null, null, "center");
            doc.text(`Horário de Geração: ${timeString}`, 105, 37, null, null, "center");
            doc.text(`Turno: ${localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido'}`, 105, 44, null, null, "center");

            // Captura o conteúdo da seção de relatório (que agora inclui o gráfico)
            const canvas = await html2canvas(relatorioFinalDisplay, { scale: 2 }); // Aumenta a escala para melhor qualidade
            const imgData = canvas.toDataURL('image/png');

            // Calcula a largura e altura da imagem para caber na página do PDF
            const imgWidth = 190; // Largura em mm
            const pageHeight = doc.internal.pageSize.height;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 55; // Posição inicial da imagem, ajustada pelos novos cabeçalhos

            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - position);
            
            while (heightLeft >= 0) {
                position = 10;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Salva o PDF com nome de arquivo que inclui data e hora
            doc.save(`relatorio_merenda_${localStorage.getItem('bauMerendaTurnoAtivo') || 'turno'}_${dateString.replace(/\//g, '-')}_${timeString.replace(/:/g, '-')}.pdf`);

            // Exibe o pop-up de sucesso
            showConfirmationPopup(); // Se você tiver um pop-up de sucesso para esta página

            // Zera os dados do localStorage e o turno ativo
            localStorage.removeItem('bauMerendaContagem');
            localStorage.removeItem('bauMerendaNumConfirmacoes');
            localStorage.removeItem('cardapioDoDia'); // Zera o cardápio para o próximo turno
            localStorage.removeItem('bauMerendaTurnoAtivo'); // Zera o turno ativo

            // Redireciona de volta para a página do admin após o pop-up
            setTimeout(() => {
                window.location.href = 'admin.html'; // Corrigido para admin.html
            }, 3500); // 3.5 segundos (3s do pop-up + 0.5s para transição)
        });
    }

    // Evento para cancelar e voltar ao painel sem zerar os dados
    if (voltarAoPainelBtn) { // Verifica se o botão existe antes de adicionar o evento
        voltarAoPainelBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o comportamento padrão do link
            window.location.href = 'admin.html'; // Corrigido para admin.html
        });
    }
});