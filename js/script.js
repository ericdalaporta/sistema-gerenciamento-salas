// js/script.js

(function () {
    'use strict';

    // -------------------------
    // --- ESTADO (STATE) ---
    // -------------------------
    const state = {
        dbSalas: [
            { id: 1, codigo: 'C10', tipo: 'Lab. Informática', capacidade: 32, localizacao: 'Bloco C' },
            { id: 2, codigo: 'A205', tipo: 'Sala de Aula', capacidade: 45, localizacao: 'Bloco A' },
            { id: 3, codigo: 'F15', tipo: 'Lab. Física', capacidade: 20, localizacao: 'Bloco F' },
            { id: 4, codigo: 'AUDIT01', tipo: 'Auditório', capacidade: 120, localizacao: 'Bloco Central' }
        ],
        dbAgendamentos: [
            { id: 101, salaId: 2, periodo: { inicio: '2025-08-26', fim: '2025-12-26' }, horario: { inicio: '14:00', fim: '16:00' }, diasSemana: [2], disciplina: 'Palestra', professor: 'Dr. Estranho', cpf: '111.111.111-11' },
            { id: 102, salaId: 3, periodo: { inicio: '2025-08-04', fim: '2025-12-12' }, horario: { inicio: '09:00', fim: '11:00' }, diasSemana: [1, 3], disciplina: 'Física Experimental', professor: 'Prof. Santos', cpf: '222.222.222-22' },
            { id: 103, salaId: 4, periodo: { inicio: '2025-09-10', fim: '2025-12-10' }, horario: { inicio: '19:00', fim: '22:00' }, diasSemana: [3], disciplina: 'Formatura', professor: 'Reitoria', cpf: '333.333.333-33' }
        ],
        fpInstance: null, // Flatpickr instance
        diasMap: { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' },
        tiposCores: { 'Lab. Informática': 'lab-info', 'Sala de Aula': 'sala-aula', 'Lab. Física': 'lab-fisica', 'Auditório': 'auditorio' }
    };

    // -------------------------
    // --- ELEMENTOS DO DOM ---
    // -------------------------
    const elements = {
        salasGrid: document.getElementById('salas-grid'),
        agendamentosList: document.getElementById('agendamentos-list'),
        searchInput: document.getElementById('searchInput'),
        tipoSelect: document.getElementById('tipoSelect'),
        capacidadeSelect: document.getElementById('capacidadeSelect'),
        agendamentosCount: document.getElementById('agendamentos-count'),
        modalAgendarEl: document.getElementById('modalAgendarSala'),
        modalAgendarInstance: null,
        modalNovaSalaInstance: null,
        agendamentoForm: document.getElementById('formAgendarSala'),
        formNovaSala: document.getElementById('formNovaSala')
    };

    // -------------------------
    // --- FUNÇÕES UTILITÁRIAS ---
    // -------------------------
    const utils = {
        formatBR: (dateISO) => dateISO ? dateISO.split('-').reverse().join('/') : '',
        formatISO: (date) => date ? date.toISOString().split('T')[0] : null,
        timeToMinutes: (hhmm) => {
            const [h, m] = hhmm.split(':').map(Number);
            return h * 60 + m;
        },
        haConflito: (novoAg) => {
            return state.dbAgendamentos.some(existente => {
                if (novoAg.id === existente.id || novoAg.salaId !== existente.salaId) return false;

                const novoInicio = new Date(novoAg.periodo.inicio);
                const novoFim = new Date(novoAg.periodo.fim);
                const exInicio = new Date(existente.periodo.inicio);
                const exFim = new Date(existente.periodo.fim);
                if (novoInicio > exFim || novoFim < exInicio) return false;

                const novoInicioMin = utils.timeToMinutes(novoAg.horario.inicio);
                const novoFimMin = utils.timeToMinutes(novoAg.horario.fim);
                const exInicioMin = utils.timeToMinutes(existente.horario.inicio);
                const exFimMin = utils.timeToMinutes(existente.horario.fim);
                if (novoInicioMin >= exFimMin || novoFimMin <= exInicioMin) return false;

                return novoAg.diasSemana.some(d => existente.diasSemana.includes(d));
            });
        },
        getSalaStatus: (salaId) => {
            const agora = new Date();
            const ocupadaAgora = state.dbAgendamentos.find(ag => {
                if (ag.salaId !== salaId) return false;
                const inicio = new Date(ag.periodo.inicio);
                const fim = new Date(ag.periodo.fim);
                fim.setDate(fim.getDate() + 1);

                if (agora >= inicio && agora < fim && ag.diasSemana.includes(agora.getDay())) {
                    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
                    const inicioMinutos = utils.timeToMinutes(ag.horario.inicio);
                    const fimMinutos = utils.timeToMinutes(ag.horario.fim);
                    return horaAtual >= inicioMinutos && horaAtual < fimMinutos;
                }
                return false;
            });
            return { status: ocupadaAgora ? 'Ocupada' : 'Disponível' };
        }
    };

    // -------------------------
    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    // -------------------------
    const render = {
        salas: (salasFiltradas = state.dbSalas) => {
            elements.salasGrid.innerHTML = salasFiltradas.length === 0
                ? `<div class="col-12"><p class="text-center text-muted mt-4">Nenhuma sala encontrada.</p></div>`
                : salasFiltradas.map(sala => {
                    const statusInfo = utils.getSalaStatus(sala.id);
                    const corTipo = state.tiposCores[sala.tipo] || 'dark';
                    const statusHtml = statusInfo.status === 'Disponível'
                        ? `<p><i class="bi bi-check-circle-fill text-success"></i> <span class="status-disponivel">Disponível</span></p>`
                        : `<p><i class="bi bi-x-circle-fill text-danger"></i> <span class="status-ocupada">Ocupada</span></p>`;
                    return `
                        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 d-flex">
                            <div class="card room-card w-100">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0 fw-bold">${sala.codigo}</h5>
                                    <div class="room-card-actions">
                                        <span class="badge bg-${corTipo}">${sala.tipo}</span>
                                        <button class="btn btn-sm btn-outline-danger btn-excluir-sala" data-sala-id="${sala.id}" title="Excluir Sala"><i class="bi bi-trash"></i></button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <p><i class="bi bi-people"></i> ${sala.capacidade} pessoas</p>
                                    <p><i class="bi bi-geo-alt"></i> ${sala.localizacao}</p>
                                    ${statusHtml}
                                </div>
                                <div class="card-footer d-grid">
                                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalAgendarSala" data-sala-id="${sala.id}" data-sala-codigo="${sala.codigo}">Agendar Sala</button>
                                </div>
                            </div>
                        </div>`;
                }).join('');
        },
        agendamentos: () => {
            const agendamentosOrdenados = [...state.dbAgendamentos].sort((a, b) => new Date(a.periodo.inicio) - new Date(b.periodo.inicio));
            elements.agendamentosList.innerHTML = agendamentosOrdenados.length === 0
                ? `<p class="text-center text-muted mt-4">Nenhum agendamento encontrado.</p>`
                : agendamentosOrdenados.map(ag => {
                    const sala = state.dbSalas.find(s => s.id === ag.salaId);
                    if (!sala) return ''; // Ignora agendamentos de salas excluídas
                    const diasHtml = ag.diasSemana.map(d => `<span class="dias-semana-badge">${state.diasMap[d]}</span>`).join('');
                    const periodoFmt = ag.periodo.inicio === ag.periodo.fim ? utils.formatBR(ag.periodo.inicio) : `${utils.formatBR(ag.periodo.inicio)} até ${utils.formatBR(ag.periodo.fim)}`;
                    return `
                        <div class="agendamento-card">
                            <div class="agendamento-header">
                                <h5><i class="bi bi-building"></i> Sala ${sala.codigo}</h5>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary btn-edit" data-bs-toggle="modal" data-bs-target="#modalAgendarSala" data-agendamento-id="${ag.id}"><i class="bi bi-pencil-square"></i></button>
                                    <button class="btn btn-sm btn-outline-danger btn-delete" data-agendamento-id="${ag.id}"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Período:</strong> ${periodoFmt}</p>
                                    <p class="mb-2"><strong>Horário:</strong> ${ag.horario.inicio} - ${ag.horario.fim}</p>
                                    <div class="mt-3 dias-desktop">${diasHtml}</div>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Disciplina:</strong> ${ag.disciplina}</p>
                                    <p class="mb-1"><strong>Professor:</strong> ${ag.professor}</p>
                                </div>
                            </div>
                            <div class="dias-mobile">${diasHtml}</div>
                        </div>`;
                }).join('');
            elements.agendamentosCount.textContent = state.dbAgendamentos.length;
        },
        filtros: () => {
            const tiposUnicos = [...new Set(state.dbSalas.map(s => s.tipo))];
            elements.tipoSelect.innerHTML = '<option value="">Todos os Tipos</option>' + tiposUnicos.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
        }
    };

    // -------------------------
    // --- MANIPULADORES DE EVENTOS (HANDLERS) ---
    // -------------------------
    const handlers = {
        aplicarFiltros: () => {
            const termo = elements.searchInput.value.toLowerCase();
            const tipo = elements.tipoSelect.value;
            const capacidade = elements.capacidadeSelect.value;
            const salasFiltradas = state.dbSalas.filter(s =>
                (s.codigo.toLowerCase().includes(termo) || s.tipo.toLowerCase().includes(termo) || s.localizacao.toLowerCase().includes(termo)) &&
                (!tipo || s.tipo === tipo) &&
                (!capacidade || (capacidade === '20' && s.capacidade <= 20) || (capacidade === '40' && s.capacidade > 20 && s.capacidade <= 40) || (capacidade === '41' && s.capacidade > 40))
            );
            render.salas(salasFiltradas);
        },
        submitNovaSala: (e) => {
            e.preventDefault();
            state.dbSalas.push({
                id: Date.now(),
                codigo: document.getElementById('salaNome').value.trim(),
                capacidade: parseInt(document.getElementById('salaCapacidade').value, 10),
                tipo: document.getElementById('salaTipo').value,
                localizacao: document.getElementById('salaBloco').value.trim(),
            });
            handlers.aplicarFiltros();
            render.filtros();
            e.target.reset();
            elements.modalNovaSalaInstance.hide();
        },
        submitAgendamento: (e) => {
            e.preventDefault();
            if (!state.fpInstance || state.fpInstance.selectedDates.length < 1) return alert('Selecione um período válido.');
            const [inicioDate, fimDate] = state.fpInstance.selectedDates;
            
            const diasSemana = Array.from(state.fpInstance.calendarContainer.querySelectorAll('.day-of-week-button.active')).map(btn => parseInt(btn.dataset.day, 10));
            if (diasSemana.length === 0) return alert('Selecione pelo menos um dia da semana.');

            const horaInicio = document.getElementById('agendamentoHoraInicio').value;
            const horaFim = document.getElementById('agendamentoHoraFim').value;
            if (utils.timeToMinutes(horaInicio) >= utils.timeToMinutes(horaFim)) return alert('Horário de início deve ser anterior ao de fim.');

            const editId = parseInt(document.getElementById('agendamentoEditId').value, 10) || 0;
            const agendamentoData = {
                id: editId || Date.now(),
                salaId: parseInt(document.getElementById('agendamentoSalaId').value, 10),
                periodo: { inicio: utils.formatISO(inicioDate), fim: utils.formatISO(fimDate || inicioDate) },
                horario: { inicio: horaInicio, fim: horaFim },
                diasSemana,
                disciplina: document.getElementById('agendamentoDisciplina').value.trim(),
                professor: document.getElementById('agendamentoProfessor').value.trim(),
                cpf: document.getElementById('agendamentoCpf').value.trim()
            };

            if (utils.haConflito(agendamentoData)) return alert('Conflito de horário! Já existe um agendamento para esta sala no período, dia e horário selecionados.');

            if (editId) {
                const idx = state.dbAgendamentos.findIndex(a => a.id === editId);
                if (idx !== -1) state.dbAgendamentos[idx] = agendamentoData;
            } else {
                state.dbAgendamentos.push(agendamentoData);
            }

            render.salas();
            render.agendamentos();
            elements.modalAgendarInstance.hide();
        },
        clickSalasGrid: (e) => {
            const deleteButton = e.target.closest('.btn-excluir-sala');
            if (!deleteButton) return;

            const salaId = parseInt(deleteButton.dataset.salaId, 10);
            if (confirm('Tem certeza que deseja excluir esta sala? Todos os agendamentos associados serão removidos.')) {
                state.dbSalas = state.dbSalas.filter(sala => sala.id !== salaId);
                state.dbAgendamentos = state.dbAgendamentos.filter(ag => ag.salaId !== salaId);
                handlers.aplicarFiltros();
                render.agendamentos();
                render.filtros();
            }
        },
        clickAgendamentosList: (e) => {
            const deleteButton = e.target.closest('.btn-delete');
            if (!deleteButton) return;

            const agendamentoId = parseInt(deleteButton.dataset.agendamentoId, 10);
            if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                state.dbAgendamentos = state.dbAgendamentos.filter(ag => ag.id !== agendamentoId);
                render.agendamentos();
                render.salas();
            }
        },
        showModalAgendar: (e) => {
            elements.agendamentoForm.reset();
            if (state.fpInstance) state.fpInstance.destroy();
            
            const button = e.relatedTarget;
            const agendamentoId = button.dataset.agendamentoId ? parseInt(button.dataset.agendamentoId, 10) : null;
            
            let sala, agendamentoParaEditar, defaultDate = [], diasSemanaAtivos = [];
            
            if (agendamentoId) {
                agendamentoParaEditar = state.dbAgendamentos.find(x => x.id === agendamentoId);
                if (!agendamentoParaEditar) return;
                sala = state.dbSalas.find(s => s.id === agendamentoParaEditar.salaId);
                document.getElementById('modalAgendarSalaLabel').textContent = `Editar Agendamento da Sala ${sala.codigo}`;
                document.getElementById('modalAgendarSubtitulo').textContent = `Altere os dados do agendamento.`;
                Object.entries({
                    'agendamentoEditId': agendamentoParaEditar.id, 'agendamentoSalaId': agendamentoParaEditar.salaId,
                    'agendamentoHoraInicio': agendamentoParaEditar.horario.inicio, 'agendamentoHoraFim': agendamentoParaEditar.horario.fim,
                    'agendamentoDisciplina': agendamentoParaEditar.disciplina, 'agendamentoProfessor': agendamentoParaEditar.professor,
                    'agendamentoCpf': agendamentoParaEditar.cpf
                }).forEach(([id, value]) => document.getElementById(id).value = value);
                defaultDate = [agendamentoParaEditar.periodo.inicio, agendamentoParaEditar.periodo.fim];
                diasSemanaAtivos = agendamentoParaEditar.diasSemana;
            } else {
                sala = state.dbSalas.find(s => s.id == button.dataset.salaId);
                document.getElementById('modalAgendarSalaLabel').textContent = `Agendar Sala ${sala.codigo}`;
                document.getElementById('modalAgendarSubtitulo').textContent = `${sala.capacidade} pessoas • ${sala.localizacao}`;
                document.getElementById('agendamentoSalaId').value = sala.id;
            }

            state.fpInstance = flatpickr("#agendamentoPeriodo", {
                mode: "range", locale: "pt", dateFormat: "d/m/Y", defaultDate,
                onReady: (_, __, instance) => {
                    const container = instance.calendarContainer;
                    const weekDaysContainer = document.createElement('div');
                    weekDaysContainer.className = 'flatpickr-weekdays-container p-2 border-top';
                    Object.entries(state.diasMap).forEach(([value, name]) => {
                        const dayButton = document.createElement('span');
                        dayButton.className = `btn btn-sm btn-outline-secondary day-of-week-button ${diasSemanaAtivos.includes(parseInt(value, 10)) ? 'active' : ''}`;
                        dayButton.textContent = name;
                        dayButton.dataset.day = value;
                        dayButton.addEventListener('click', (ev) => ev.currentTarget.classList.toggle('active'));
                        weekDaysContainer.appendChild(dayButton);
                    });
                    container.appendChild(weekDaysContainer);
                }
            });
        }
    };
    
    // -------------------------
    // --- INICIALIZAÇÃO ---
    // -------------------------
    function init() {
        if (!elements.salasGrid) return; // Garante que o script só rode na página principal.html

        elements.modalAgendarInstance = new bootstrap.Modal(elements.modalAgendarEl);
        elements.modalNovaSalaInstance = new bootstrap.Modal(document.getElementById('modalNovaSala'));
        
        // Adiciona Listeners
        ['input', 'change'].forEach(evt => {
            elements.searchInput.addEventListener(evt, handlers.aplicarFiltros);
            elements.tipoSelect.addEventListener(evt, handlers.aplicarFiltros);
            elements.capacidadeSelect.addEventListener(evt, handlers.aplicarFiltros);
        });
        elements.formNovaSala.addEventListener('submit', handlers.submitNovaSala);
        elements.agendamentoForm.addEventListener('submit', handlers.submitAgendamento);
        elements.salasGrid.addEventListener('click', handlers.clickSalasGrid);
        elements.agendamentosList.addEventListener('click', handlers.clickAgendamentosList);
        elements.modalAgendarEl.addEventListener('show.bs.modal', handlers.showModalAgendar);

        // Renderização Inicial
        render.filtros();
        render.salas();
        render.agendamentos();
    }

    document.addEventListener('DOMContentLoaded', init);

})();