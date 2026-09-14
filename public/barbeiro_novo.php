<?php
require_once '../includes/funcoes.php';

$tituloPagina = 'Novo barbeiro | Barbearia Prime';
$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'danger';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h1 class="fw-bold h3 mb-0">Cadastrar barbeiro</h1>
                        <a href="barbeiros.php" class="btn btn-outline-secondary btn-sm">Voltar para a lista</a>
                    </div>
                    <p class="text-muted">Informe os dados do novo profissional da barbearia.</p>

                    <?php if (campoObrigatorio($mensagem)): ?>
                        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
                            <?= limparTexto($mensagem); ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    <?php endif; ?>

                    <form action="salvar_barbeiro.php" method="post" class="row g-3">
                        <div class="col-md-7">
                            <label for="nome" class="form-label">Nome completo</label>
                            <input
                                type="text"
                                class="form-control"
                                id="nome"
                                name="nome"
                                maxlength="100"
                                placeholder="Ex: Lucas Ferreira"
                                required
                            >
                        </div>

                        <div class="col-md-5">
                            <label for="cpf" class="form-label">CPF</label>
                            <input
                                type="text"
                                class="form-control"
                                id="cpf"
                                name="cpf"
                                maxlength="14"
                                placeholder="000.000.000-00"
                                required
                            >
                        </div>

                        <div class="col-md-6">
                            <label for="email" class="form-label">E-mail de contato</label>
                            <input
                                type="email"
                                class="form-control"
                                id="email"
                                name="email"
                                maxlength="100"
                                placeholder="barbeiro@barbeariaprime.com"
                            >
                        </div>

                        <div class="col-md-6">
                            <label for="telefone" class="form-label">Telefone celular</label>
                            <input
                                type="text"
                                class="form-control"
                                id="telefone"
                                name="telefone"
                                maxlength="15"
                                placeholder="(00) 00000-0000"
                            >
                        </div>

                        <div class="col-12 d-flex gap-2 pt-2">
                            <button type="submit" class="btn btn-dark">Salvar barbeiro</button>
                            <a href="barbeiros.php" class="btn btn-outline-secondary">Cancelar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
