// finalizar_turno_script.js

document.addEventListener('DOMContentLoaded', () => {
    const gerarRelatorioPdfBtn = document.getElementById('gerar-relatorio-pdf-final');
    const cancelarFinalizarBtn = document.getElementById('cancelar-finalizar-btn');
    const relatorioFinalDisplay = document.getElementById('relatorio-final-display');
    const reportTextContentDiv = document.getElementById('report-text-content'); // NOVO: Referência à div de texto
    const finalMerendaChartCanvas = document.getElementById('finalMerendaChart'); // NOVO: Referência ao canvas do gráfico
    let finalMerendaChartInstance; // NOVO: Para armazenar a instância do gráfico

    // Função para carregar e exibir o relatório antes de gerar o PDF
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

        // NOVO: Renderiza o gráfico após exibir o texto
        renderFinalChart(cardapioDoDia, contagemMerenda);
    }

    // NOVO: Função para renderizar o gráfico Chart.js
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

    // Evento para gerar o PDF e zerar os dados
    gerarRelatorioPdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Oculta os botões para não aparecerem no PDF
        gerarRelatorioPdfBtn.style.display = 'none';
        cancelarFinalizarBtn.style.display = 'none';

        // Obtém a data e hora atuais
        const now = new Date();
        const dateString = now.toLocaleDateString('pt-BR');
        const timeString = now.toLocaleTimeString('pt-BR'); // NOVO: Obtém o horário

        // Adiciona um título, data e horário ao PDF
        doc.setFontSize(22);
        doc.text("Relatório de Merenda - Baú da Merenda Digital", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(`Data: ${dateString}`, 105, 30, null, null, "center");
        doc.text(`Horário de Geração: ${timeString}`, 105, 37, null, null, "center"); // NOVO: Adiciona o horário
        doc.text(`Turno: ${localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido'}`, 105, 44, null, null, "center"); // Posição ajustada

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
        heightLeft -= (pageHeight - position); // Ajusta heightLeft para a primeira página
        
        while (heightLeft >= 0) {
            position = 10; // Próximas páginas começam do topo
            doc.addPage();
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Salva o PDF com nome de arquivo que inclui data e hora
        doc.save(`relatorio_merenda_${localStorage.getItem('bauMerendaTurnoAtivo') || 'turno'}_${dateString.replace(/\//g, '-')}_${timeString.replace(/:/g, '-')}.pdf`);

        alert('Relatório PDF gerado com sucesso! Os dados do turno foram zerados.');

        // Zera os dados do localStorage e o turno ativo
        localStorage.removeItem('bauMerendaContagem');
        localStorage.removeItem('bauMerendaNumConfirmacoes');
        localStorage.removeItem('cardapioDoDia'); // Zera o cardápio para o próximo turno
        localStorage.removeItem('bauMerendaTurnoAtivo'); // Zera o turno ativo

        // Redireciona de volta para a página do admin
        window.location.href = 'admin.html';
    });

    // Evento para cancelar e voltar ao painel sem zerar os dados
    cancelarFinalizarBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
});
// Função para mostrar o pop-up
function showPopup(messageElementId) {
    const popup = document.getElementById(messageElementId);
    if (popup) {
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000); // O pop-up desaparece após 3 segundos
    }
}

// --- Código existente do seu script finalizar_turno_script.js ---
// ... (mantenha todo o seu código existente aqui) ...

// Exemplo de como você chamaria o pop-up após gerar o PDF e zerar os dados:
document.addEventListener('DOMContentLoaded', () => {
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio-pdf-final');
    
    if (gerarRelatorioBtn) {
        gerarRelatorioBtn.addEventListener('click', async () => {
            // (Seu código existente para gerar PDF e zerar dados aqui)
            // Simulação de sucesso da geração do PDF e zerar dados
            console.log('Gerando relatório PDF e zerando dados do turno...');

            // Supondo que a geração do PDF e o zeramento de dados ocorram aqui
            // E que eles sejam bem-sucedidos
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simula um atraso

            // CHAMA O POP-UP DE SUCESSO
            showPopup('success-popup');

            // Redireciona de volta ao painel após um pequeno atraso para o usuário ver o pop-up
            setTimeout(() => {
                window.location.href = 'admin_panel.html'; // Altere para a URL correta do seu painel
            }, 3500); // 3.5 segundos (3s do pop-up + 0.5s para transição)
        });
    }

    // Código para o botão "Voltar ao Painel"
    const cancelarFinalizarBtn = document.getElementById('cancelar-finalizar-btn');
    if (cancelarFinalizarBtn) {
        cancelarFinalizarBtn.addEventListener('click', () => {
            window.location.href = 'admin_panel.html'; // Altere para a URL correta do seu painel
        });
    }

    // ... (restante do seu código JavaScript, se houver) ...
});
// --- FUNÇÃO PARA MOSTRAR O POP-UP ---
function showPopup(messageElementId) {
    const popup = document.getElementById(messageElementId);
    if (popup) {
        popup.classList.add('show');
        // O pop-up desaparece após 3 segundos
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000); 
    }
}

// --- Listener para garantir que o DOM esteja totalmente carregado ---
document.addEventListener('DOMContentLoaded', () => {
    // Referência ao botão "Gerar Relatório em PDF"
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio-pdf-final');
    
    // Verifica se o botão existe antes de adicionar o evento
    if (gerarRelatorioBtn) {
        gerarRelatorioBtn.addEventListener('click', async () => {
            // --- INÍCIO DO SEU CÓDIGO EXISTENTE PARA GERAR PDF E ZERAR DADOS ---
            // Você deve ter a lógica real de geração de PDF e zeramento de dados aqui.
            // Por exemplo:
            console.log('Iniciando geração do relatório PDF...');
            // await gerarPDFReal(); // Se você tiver uma função assíncrona para gerar o PDF
            // await zerarDadosDoTurno(); // Se você tiver uma função assíncrona para zerar os dados
            
            // Simulação de um processo que leva tempo (ex: geração de PDF)
            // Remova esta linha na implementação real
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            // --- FIM DO SEU CÓDIGO EXISTENTE ---

            // CHAMA O POP-UP DE SUCESSO APÓS A OPERAÇÃO SER CONCLUÍDA
            showPopup('success-popup');

            // Redireciona de volta ao painel após um pequeno atraso para o usuário ver o pop-up
            setTimeout(() => {
                window.location.href = 'admin_panel.html'; // Altere para a URL correta do seu painel
            }, 3500); // 3.5 segundos (3s do pop-up + 0.5s para transição)
        });
    }

    // Código para o botão "Voltar ao Painel" (MANTIDO DO SEU CÓDIGO ORIGINAL)
    const cancelarFinalizarBtn = document.getElementById('cancelar-finalizar-btn');
    if (cancelarFinalizarBtn) {
        cancelarFinalizarBtn.addEventListener('click', () => {
            window.location.href = 'admin_panel.html'; // Altere para a URL correta do seu painel
        });
    }

    // --- Outros códigos JavaScript que você já tenha no finalizar_turno_script.js devem vir AQUI ---
    // Exemplo:
    // setupChart();
    // loadReportData();
});
