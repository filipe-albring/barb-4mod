<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idBarbeiro = (int) ($_POST['id_barbeiro'] ?? 0);
$paginaRetorno = $idBarbeiro > 0 ? "barbeiro_editar.php?id={$idBarbeiro}" : 'barbeiro_novo.php';

$nome = trim($_POST['nome'] ?? '');
$cpf = trim($_POST['cpf'] ?? '');
$email = trim($_POST['email'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');

if (!campoObrigatorio($nome) || !campoObrigatorio($cpf)) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Nome e CPF são campos obrigatórios.');
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Informe um endereço de e-mail válido.');
}

$dados = [
    'nome' => $nome,
    'cpf' => $cpf,
    'email' => $email,
    'telefone' => $telefone,
];

try {
    $conexao = conectarBanco();

    if ($idBarbeiro > 0) {
        atualizarBarbeiro($conexao, $idBarbeiro, $dados);
        redirecionarComMensagem('barbeiros.php', 'success', 'Dados do barbeiro atualizados com sucesso.');
    } else {
        cadastrarBarbeiro($conexao, $dados);
        redirecionarComMensagem('barbeiros.php', 'success', 'Barbeiro cadastrado com sucesso.');
    }
} catch (Throwable $erro) {
    $acao = $idBarbeiro > 0 ? 'atualizar' : 'cadastrar';
    redirecionarComMensagem($paginaRetorno, 'danger', "Não foi possível {$acao} o profissional. Verifique se o CPF já está cadastrado.");
}
