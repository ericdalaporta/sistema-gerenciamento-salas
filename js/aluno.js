(function () {
    'use strict';

    const db = {
        salas: [
            { id: 1, codigo: 'C10', tipo: 'Lab. Informática', capacidade: 32, localizacao: 'Bloco C' },
            { id: 2, codigo: 'A205', tipo: 'Sala de Aula', capacidade: 45, localizacao: 'Bloco A' },
            { id: 3, codigo: 'F15', tipo: 'Lab. Física', capacidade: 20, localizacao: 'Bloco F' },
            { id: 4, codigo: 'AUDIT01', tipo: 'Auditório', capacidade: 120, localizacao: 'Bloco Central' }
        ],
        agendamentos: [
            { id: 101, salaId: 2, periodo: { inicio: '2025-08-26', fim: '2025-12-26' }, horario: { inicio: '14:00', fim: '16:00' }, diasSemana: [2], disciplina: 'Palestra', professor: 'Dr. Estranho' },
            { id: 102, salaId: 3, periodo: { inicio: '2025-08-04', fim: '2025-12-12' }, horario: { inicio: '09:00', fim: '11:00' }, diasSemana: [1, 3], disciplina: 'Física Experimental', professor: 'Prof. Santos' },
            { id: 103, salaId: 1, periodo: { inicio: '2025-09-02', fim: '2025-09-30' }, horario: { inicio: '19:00', fim: '22:00' }, diasSemana: [2, 4], disciplina: 'Algoritmos Avançados', professor: 'Profa. Ada' },
        ]
    };

    const elements = {
        aulasHojeList: document.getElementById('aulas-hoje-list'),
        proximasAulasList: document.getElementById('proximas-aulas-list')
    };

    function createAgendamentoCard(agendamento, showFullDate = false) {
        const sala = db.salas.find(s => s.id === agendamento.salaId);
        if (!sala) return '';

        const diasSemanaMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const diasHtml = agendamento.diasSemana
            .map(dia => `<span class="dias-semana-badge">${diasSemanaMap[dia]}</span>`)
            .join('');

        const formatBrDate = (dateStr) => {
            if (!dateStr) return 'Data indefinida';
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const periodoFmt = `${formatBrDate(agendamento.periodo.inicio)} até ${formatBrDate(agendamento.periodo.fim)}`;

        return `
            <div class="agendamento-card">
                <div class="agendamento-header">
                    <h5><i class="bi bi-building"></i> ${sala.codigo}</h5>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Período:</strong> ${periodoFmt}</p>
                        <p class="mb-2"><strong>Horário:</strong> ${agendamento.horario.inicio} - ${agendamento.horario.fim}</p>
                        ${showFullDate ? '' : diasHtml} 
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Disciplina:</strong> ${agendamento.disciplina}</p>
                        <p class="mb-1"><strong>Professor:</strong> ${agendamento.professor}</p>
                    </div>
                </div>
                ${showFullDate ? `<div class="mt-3">${diasHtml}</div>` : ''} 
            </div>`;
    }

    function renderAulas() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const diaDaSemanaHoje = hoje.getDay();

        const aulasHoje = db.agendamentos.filter(ag => {
            const inicio = new Date(ag.periodo.inicio + 'T00:00:00');
            const fim = new Date(ag.periodo.fim + 'T00:00:00');
            return hoje >= inicio && hoje <= fim && ag.diasSemana.includes(diaDaSemanaHoje);
        });
        
        const proximasAulas = db.agendamentos.filter(ag => {
             const inicio = new Date(ag.periodo.inicio + 'T00:00:00');
             return inicio > hoje;
        });

        elements.aulasHojeList.innerHTML = aulasHoje.length > 0
            ? aulasHoje.map(ag => createAgendamentoCard(ag)).join('')
            : '<p class="text-center text-muted">Nenhuma aula agendada para hoje.</p>';
            
        elements.proximasAulasList.innerHTML = proximasAulas.length > 0
            ? proximasAulas.map(ag => createAgendamentoCard(ag, true)).join('')
            : '<p class="text-center text-muted">Nenhuma aula futura encontrada.</p>';
    }

    document.addEventListener('DOMContentLoaded', renderAulas);


})();
