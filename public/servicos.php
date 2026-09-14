<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$conexao = conectarBanco();
$servicos = buscarServicos($conexao);
$tituloPagina = 'Serviços | Barbearia Prime';

$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'success';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
            <h1 class="fw-bold mb-1">Serviços</h1>
            <p class="text-muted mb-0">Catálogo e valores dos serviços disponíveis na barbearia.</p>
        </div>
        <a href="servico_novo.php" class="btn btn-dark">Cadastrar novo serviço</a>
    </div>

    <?php if (campoObrigatorio($mensagem)): ?>
        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show mb-4" role="alert">
            <?= limparTexto($mensagem); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>
    <?php endif; ?>

    <div class="row g-4">
        <?php if (count($servicos) > 0): ?>
            <?php foreach ($servicos as $servico): ?>
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body d-flex flex-column justify-content-between p-4">
                            <div>
                                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                    <h2 class="h5 fw-bold mb-0"><?= limparTexto($servico['nm_servico']); ?></h2>
                                    <span class="badge text-bg-dark fs-6"><?= formatarMoeda((float) $servico['vl_preco']); ?></span>
                                </div>
                                <p class="text-muted small">Atendimento profissional com reserva de horário.</p>
                            </div>
                            <div class="d-flex gap-2 pt-3 border-top mt-3">
                                <a href="servico_editar.php?id=<?= (int) $servico['id_servico']; ?>" class="btn btn-sm btn-outline-dark w-50">
                                    Editar
                                </a>
                                <form action="excluir_servico.php" method="post" class="w-50" onsubmit="return confirm('Tem certeza que deseja excluir o serviço <?= htmlspecialchars(addslashes($servico['nm_servico']), ENT_QUOTES, 'UTF-8'); ?>?');">
                                    <input type="hidden" name="id_servico" value="<?= (int) $servico['id_servico']; ?>">
                                    <button type="submit" class="btn btn-sm btn-outline-danger w-100">
                                        Excluir
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="col-12">
                <div class="alert alert-warning">Ainda não existem serviços cadastrados.</div>
            </div>
        <?php endif; ?>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
