document.addEventListener('DOMContentLoaded', () => {
    const formAluno = document.getElementById('formLoginAluno');
    if (formAluno) {
        formAluno.addEventListener('submit', (event) => {
            event.preventDefault();
            // Simula o login e redireciona
            window.location.href = 'aluno.html';
        });
    }

    const formServidor = document.getElementById('formLoginServidor');
    if (formServidor) {
        formServidor.addEventListener('submit', (event) => {
            event.preventDefault();
            // Simula o login e redireciona
            window.location.href = 'principal.html';
        });
    }
});