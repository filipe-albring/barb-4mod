<?php
require_once '../includes/funcoes.php';

$tituloPagina = 'Novo serviço | Barbearia Prime';
$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'danger';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-6">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h1 class="fw-bold h3 mb-0">Novo serviço</h1>
                        <a href="servicos.php" class="btn btn-outline-secondary btn-sm">Voltar para serviços</a>
                    </div>
                    <p class="text-muted">Cadastre um novo serviço e seu respectivo valor.</p>

                    <?php if (campoObrigatorio($mensagem)): ?>
                        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
                            <?= limparTexto($mensagem); ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    <?php endif; ?>

                    <form action="salvar_servico.php" method="post" class="row g-3">
                        <div class="col-12">
                            <label for="nome" class="form-label">Nome do serviço</label>
                            <input
                                type="text"
                                class="form-control"
                                id="nome"
                                name="nome"
                                maxlength="20"
                                placeholder="Ex: Corte Degradê, Barba Terapia"
                                required
                            >
                            <div class="form-text">Máximo de 20 caracteres.</div>
                        </div>

                        <div class="col-12">
                            <label for="preco" class="form-label">Preço (R$)</label>
                            <input
                                type="number"
                                class="form-control"
                                id="preco"
                                name="preco"
                                step="0.01"
                                min="0.01"
                                placeholder="Ex: 35.00"
                                required
                            >
                        </div>

                        <div class="col-12 d-flex gap-2 pt-2">
                            <button type="submit" class="btn btn-dark">Salvar serviço</button>
                            <a href="servicos.php" class="btn btn-outline-secondary">Cancelar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
