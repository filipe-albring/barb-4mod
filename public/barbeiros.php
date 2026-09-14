<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$conexao = conectarBanco();
$barbeiros = buscarBarbeiros($conexao);
$tituloPagina = 'Barbeiros | Barbearia Prime';

$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'success';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
            <h1 class="fw-bold mb-1">Barbeiros</h1>
            <p class="text-muted mb-0">Profissionais da equipe cadastrados no sistema.</p>
        </div>
        <a href="barbeiro_novo.php" class="btn btn-dark">Cadastrar novo barbeiro</a>
    </div>

    <?php if (campoObrigatorio($mensagem)): ?>
        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show mb-4" role="alert">
            <?= limparTexto($mensagem); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>
    <?php endif; ?>

    <div class="row g-4">
        <?php if (count($barbeiros) > 0): ?>
            <?php foreach ($barbeiros as $barbeiro): ?>
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body d-flex flex-column justify-content-between p-4">
                            <div>
                                <h2 class="h5 fw-bold mb-1"><?= limparTexto($barbeiro['nm_barbeiro']); ?></h2>
                                <p class="text-muted small mb-3">Profissional disponível para atendimento.</p>

                                <?php if (campoObrigatorio($barbeiro['emails'] ?? '')): ?>
                                    <p class="mb-1 small">
                                        <strong>E-mail:</strong> <?= limparTexto($barbeiro['emails']); ?>
                                    </p>
                                <?php endif; ?>

                                <?php if (campoObrigatorio($barbeiro['telefones'] ?? '')): ?>
                                    <p class="mb-0 small">
                                        <strong>Telefone:</strong> <?= limparTexto($barbeiro['telefones']); ?>
                                    </p>
                                <?php endif; ?>
                            </div>

                            <div class="d-flex gap-2 pt-3 border-top mt-3">
                                <a href="barbeiro_editar.php?id=<?= (int) $barbeiro['id_barbeiro']; ?>" class="btn btn-sm btn-outline-dark w-50">
                                    Editar
                                </a>
                                <form action="excluir_barbeiro.php" method="post" class="w-50" onsubmit="return confirm('Tem certeza que deseja excluir o profissional <?= htmlspecialchars(addslashes($barbeiro['nm_barbeiro']), ENT_QUOTES, 'UTF-8'); ?>?');">
                                    <input type="hidden" name="id_barbeiro" value="<?= (int) $barbeiro['id_barbeiro']; ?>">
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
                <div class="alert alert-warning">Ainda não existem barbeiros cadastrados.</div>
            </div>
        <?php endif; ?>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
