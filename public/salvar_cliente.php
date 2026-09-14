<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idCliente = (int) ($_POST['id_cliente'] ?? 0);
$paginaRetorno = $idCliente > 0 ? "cliente_editar.php?id={$idCliente}" : 'cliente_novo.php';

$dados = [
    'nome' => $_POST['nome'] ?? '',
    'data_nascimento' => $_POST['data_nascimento'] ?? '',
    'cpf' => $_POST['cpf'] ?? '',
    'email' => $_POST['email'] ?? '',
    'telefone' => $_POST['telefone'] ?? '',
];

if (
    !campoObrigatorio($dados['nome']) ||
    !campoObrigatorio($dados['data_nascimento']) ||
    !campoObrigatorio($dados['cpf']) ||
    !campoObrigatorio($dados['email']) ||
    !campoObrigatorio($dados['telefone'])
) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Preencha todos os campos obrigatórios.');
}

if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Informe um e-mail válido.');
}

$dataNascimento = converterDataBrasileiraParaMysql($dados['data_nascimento']);

if (!$dataNascimento) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Informe a data de nascimento no formato dd/mm/aaaa.');
}

$dados['data_nascimento'] = $dataNascimento;

try {
    $conexao = conectarBanco();

    if ($idCliente > 0) {
        atualizarCliente($conexao, $idCliente, $dados);
        redirecionarComMensagem('clientes.php', 'success', 'Dados do cliente atualizados com sucesso.');
    } else {
        cadastrarCliente($conexao, $dados);
        redirecionarComMensagem('clientes.php', 'success', 'Cliente cadastrado com sucesso.');
    }
} catch (Throwable $erro) {
    $acao = $idCliente > 0 ? 'atualizar' : 'cadastrar';
    redirecionarComMensagem($paginaRetorno, 'danger', "Não foi possível {$acao} o cliente. Verifique se o CPF ou e-mail já estão em uso.");
}
