<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$conexao = conectarBanco();
$termoBusca = $_GET['busca'] ?? '';
$clientes = buscarClientesCompletos($conexao, $termoBusca);
$tituloPagina = 'Clientes | Barbearia Prime';
$mensagem = $_GET['mensagem'] ?? '';
$tipo = $_GET['tipo'] ?? 'success';

require_once '../includes/cabecalho.php';
require_once '../includes/menu.php';
?>

<main class="container py-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
            <h1 class="fw-bold mb-1">Clientes</h1>
            <p class="text-muted mb-0">Gestão completa da base de clientes da barbearia.</p>
        </div>
        <a href="cliente_novo.php" class="btn btn-dark">Cadastrar novo cliente</a>
    </div>

    <?php if (campoObrigatorio($mensagem)): ?>
        <div class="alert alert-<?= limparTexto($tipo); ?> alert-dismissible fade show" role="alert">
            <?= limparTexto($mensagem); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>
    <?php endif; ?>

    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-3">
            <form action="clientes.php" method="get" class="row g-2 align-items-center">
                <div class="col-md-9">
                    <input
                        type="text"
                        name="busca"
                        class="form-control"
                        placeholder="Buscar cliente por nome, CPF, e-mail ou telefone..."
                        value="<?= limparTexto($termoBusca); ?>"
                    >
                </div>
                <div class="col-md-3 d-flex gap-2">
                    <button type="submit" class="btn btn-dark w-100">Pesquisar</button>
                    <?php if ($termoBusca !== ''): ?>
                        <a href="clientes.php" class="btn btn-outline-secondary">Limpar</a>
                    <?php endif; ?>
                </div>
            </form>
        </div>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Data Nasc.</th>
                            <th>Contato</th>
                            <th class="text-center">Agendamentos</th>
                            <th class="text-end">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($clientes) > 0): ?>
                            <?php foreach ($clientes as $c): ?>
                                <tr>
                                    <td class="fw-semibold"><?= limparTexto($c['nm_cliente']); ?></td>
                                    <td><?= limparTexto($c['cpf_cliente']); ?></td>
                                    <td><?= !empty($c['dt_nascimento']) ? date('d/m/Y', strtotime($c['dt_nascimento'])) : '—'; ?></td>
                                    <td>
                                        <small class="d-block text-muted"><?= limparTexto($c['email'] ?: 'Sem e-mail'); ?></small>
                                        <small class="d-block"><?= limparTexto($c['telefone'] ?: 'Sem telefone'); ?></small>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge <?= (int) $c['total_agendamentos'] > 0 ? 'text-bg-secondary' : 'text-bg-light border'; ?>">
                                            <?= (int) $c['total_agendamentos']; ?> agenda(s)
                                        </span>
                                    </td>
                                    <td class="text-end">
                                        <div class="d-inline-flex gap-1">
                                            <a href="cliente_editar.php?id=<?= (int) $c['id_cliente']; ?>" class="btn btn-sm btn-outline-dark">
                                                Editar
                                            </a>
                                            <form action="excluir_cliente.php" method="post" class="d-inline" onsubmit="return confirm('Tem certeza que deseja excluir este cliente?');">
                                                <input type="hidden" name="id_cliente" value="<?= (int) $c['id_cliente']; ?>">
                                                <button type="submit" class="btn btn-sm btn-outline-danger">
                                                    Excluir
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="6" class="text-center text-muted py-4">
                                    Nenhum cliente encontrado <?= $termoBusca !== '' ? 'para a busca "' . limparTexto($termoBusca) . '"' : 'no banco de dados'; ?>.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</main>

<?php require_once '../includes/rodape.php'; ?>
