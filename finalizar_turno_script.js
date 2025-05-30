// finalizar_turno_script.js

document.addEventListener('DOMContentLoaded', () => {
    const gerarRelatorioPdfBtn = document.getElementById('gerar-relatorio-pdf-final');
    const cancelarFinalizarBtn = document.getElementById('cancelar-finalizar-btn');
    const relatorioFinalDisplay = document.getElementById('relatorio-final-display');

    // Função para carregar e exibir o relatório antes de gerar o PDF
    function loadAndDisplayReport() {
        const contagemMerenda = JSON.parse(localStorage.getItem('bauMerendaContagem') || '{}');
        const numConfirmacoes = parseInt(localStorage.getItem('bauMerendaNumConfirmacoes') || '0');
        const cardapioDoDia = JSON.parse(localStorage.getItem('cardapioDoDia') || '[]');
        const turnoAtivo = localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido';

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

        relatorioFinalDisplay.innerHTML = reportHtml;
    }

    // Chama a função para exibir o relatório ao carregar a página
    loadAndDisplayReport();

    // Evento para gerar o PDF e zerar os dados
    gerarRelatorioPdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Oculta os botões para não aparecerem no PDF
        gerarRelatorioPdfBtn.style.display = 'none';
        cancelarFinalizarBtn.style.display = 'none';

        // Captura o conteúdo da seção de relatório para o PDF
        const relatorioSection = document.querySelector('.section-card'); // Captura o card inteiro
        
        // Adiciona um título ao PDF para melhor visualização
        doc.setFontSize(22);
        doc.text("Relatório de Merenda - Baú da Merenda Digital", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, null, null, "center");
        doc.text(`Turno: ${localStorage.getItem('bauMerendaTurnoAtivo') || 'Não definido'}`, 105, 37, null, null, "center");
        
        // Espera o html2canvas renderizar o conteúdo do relatório
        const canvas = await html2canvas(relatorioFinalDisplay, { scale: 2 }); // Aumenta a escala para melhor qualidade
        const imgData = canvas.toDataURL('image/png');

        // Calcula a largura e altura da imagem para caber na página do PDF
        const imgWidth = 190; // Largura em mm
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 50; // Posição inicial da imagem
        
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save(`relatorio_merenda_${localStorage.getItem('bauMerendaTurnoAtivo') || 'turno'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);

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