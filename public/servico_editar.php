<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idServico = (int) ($_GET['id'] ?? 0);
if ($idServico <= 0) {
    redirecionarComMensagem('servicos.php', 'danger', 'Serviço inválido.');
}

$conexao = conectarBanco();
$servico = buscarServicoPorId($conexao, $idServico);

if (!$servico) {
    redirecionarComMensagem('servicos.php', 'danger', 'Serviço não encontrado.');
}

$tituloPagina = 'Editar serviço | Barbearia Prime';
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
                        <h1 class="fw-bold h3 mb-0">Editar serviço</h1>
                        <a href="servicos.php" class="btn btn-outline-secondary btn-sm">Voltar para serviços</a>
                    </div>
                    <p class="text-muted">Altere o nome ou valor cobrado pelo serviço.</p>

                    <?php if (campoObrigatorio($mensagem)): ?>
                        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
                            <?= limparTexto($mensagem); ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    <?php endif; ?>

                    <form action="salvar_servico.php" method="post" class="row g-3">
                        <input type="hidden" name="id_servico" value="<?= (int) $servico['id_servico']; ?>">

                        <div class="col-12">
                            <label for="nome" class="form-label">Nome do serviço</label>
                            <input
                                type="text"
                                class="form-control"
                                id="nome"
                                name="nome"
                                maxlength="20"
                                value="<?= limparTexto($servico['nm_servico']); ?>"
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
                                value="<?= number_format((float) $servico['vl_preco'], 2, '.', ''); ?>"
                                required
                            >
                        </div>

                        <div class="col-12 d-flex gap-2 pt-2">
                            <button type="submit" class="btn btn-dark">Salvar alterações</button>
                            <a href="servicos.php" class="btn btn-outline-secondary">Cancelar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
