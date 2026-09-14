<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idBarbeiro = (int) ($_GET['id'] ?? 0);
if ($idBarbeiro <= 0) {
    redirecionarComMensagem('barbeiros.php', 'danger', 'Barbeiro inválido.');
}

$conexao = conectarBanco();
$barbeiro = buscarBarbeiroPorId($conexao, $idBarbeiro);

if (!$barbeiro) {
    redirecionarComMensagem('barbeiros.php', 'danger', 'Barbeiro não encontrado.');
}

$tituloPagina = 'Editar barbeiro | Barbearia Prime';
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
                        <h1 class="fw-bold h3 mb-0">Editar barbeiro</h1>
                        <a href="barbeiros.php" class="btn btn-outline-secondary btn-sm">Voltar para a lista</a>
                    </div>
                    <p class="text-muted">Atualize os dados e contatos do profissional.</p>

                    <?php if (campoObrigatorio($mensagem)): ?>
                        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
                            <?= limparTexto($mensagem); ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    <?php endif; ?>

                    <form action="salvar_barbeiro.php" method="post" class="row g-3">
                        <input type="hidden" name="id_barbeiro" value="<?= (int) $barbeiro['id_barbeiro']; ?>">

                        <div class="col-md-7">
                            <label for="nome" class="form-label">Nome completo</label>
                            <input
                                type="text"
                                class="form-control"
                                id="nome"
                                name="nome"
                                maxlength="100"
                                value="<?= limparTexto($barbeiro['nm_barbeiro']); ?>"
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
                                value="<?= limparTexto($barbeiro['cpf_barbeiro']); ?>"
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
                                value="<?= limparTexto($barbeiro['email'] ?? ''); ?>"
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
                                value="<?= limparTexto($barbeiro['telefone'] ?? ''); ?>"
                            >
                        </div>

                        <div class="col-12 d-flex gap-2 pt-2">
                            <button type="submit" class="btn btn-dark">Salvar alterações</button>
                            <a href="barbeiros.php" class="btn btn-outline-secondary">Cancelar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
