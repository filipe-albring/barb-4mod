<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idCliente = (int) ($_GET['id'] ?? 0);
if ($idCliente <= 0) {
    redirecionarComMensagem('clientes.php', 'danger', 'Cliente inválido.');
}

$conexao = conectarBanco();
$cliente = buscarClientePorId($conexao, $idCliente);

if (!$cliente) {
    redirecionarComMensagem('clientes.php', 'danger', 'Cliente não encontrado.');
}

$tituloPagina = 'Editar cliente | Barbearia Prime';
$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'danger';

$dataNascFormatada = !empty($cliente['dt_nascimento'])
    ? date('d/m/Y', strtotime($cliente['dt_nascimento']))
    : '';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h1 class="fw-bold h3 mb-0">Editar cliente</h1>
                        <a href="clientes.php" class="btn btn-outline-secondary btn-sm">Voltar para a lista</a>
                    </div>
                    <p class="text-muted">Atualize as informações cadastrais do cliente.</p>

                    <?php if (campoObrigatorio($mensagem)): ?>
                        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
                            <?= limparTexto($mensagem); ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    <?php endif; ?>

                    <form action="salvar_cliente.php" method="post" class="row g-3">
                        <input type="hidden" name="id_cliente" value="<?= (int) $cliente['id_cliente']; ?>">

                        <div class="col-md-8">
                            <label for="nome" class="form-label">Nome completo</label>
                            <input
                                type="text"
                                class="form-control"
                                id="nome"
                                name="nome"
                                maxlength="100"
                                value="<?= limparTexto($cliente['nm_cliente']); ?>"
                                required
                            >
                        </div>

                        <div class="col-md-4">
                            <label for="data_nascimento" class="form-label">Data de nascimento</label>
                            <input
                                type="text"
                                class="form-control mascara-data"
                                id="data_nascimento"
                                name="data_nascimento"
                                maxlength="10"
                                placeholder="dd/mm/aaaa"
                                value="<?= limparTexto($dataNascFormatada); ?>"
                                required
                            >
                        </div>

                        <div class="col-md-4">
                            <label for="cpf" class="form-label">CPF</label>
                            <input
                                type="text"
                                class="form-control"
                                id="cpf"
                                name="cpf"
                                maxlength="14"
                                placeholder="000.000.000-00"
                                value="<?= limparTexto($cliente['cpf_cliente']); ?>"
                                required
                            >
                        </div>

                        <div class="col-md-4">
                            <label for="email" class="form-label">E-mail</label>
                            <input
                                type="email"
                                class="form-control"
                                id="email"
                                name="email"
                                maxlength="100"
                                value="<?= limparTexto($cliente['email'] ?? ''); ?>"
                                required
                            >
                        </div>

                        <div class="col-md-4">
                            <label for="telefone" class="form-label">Telefone</label>
                            <input
                                type="text"
                                class="form-control"
                                id="telefone"
                                name="telefone"
                                maxlength="15"
                                placeholder="(00) 00000-0000"
                                value="<?= limparTexto($cliente['telefone'] ?? ''); ?>"
                                required
                            >
                        </div>

                        <div class="col-12 d-flex gap-2 pt-2">
                            <button type="submit" class="btn btn-dark">Salvar alterações</button>
                            <a href="clientes.php" class="btn btn-outline-secondary">Cancelar</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
