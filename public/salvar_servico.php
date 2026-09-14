<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idServico = (int) ($_POST['id_servico'] ?? 0);
$paginaRetorno = $idServico > 0 ? "servico_editar.php?id={$idServico}" : 'servico_novo.php';

$nome = trim($_POST['nome'] ?? '');
$preco = filter_input(INPUT_POST, 'preco', FILTER_VALIDATE_FLOAT);

if (!campoObrigatorio($nome) || $preco === false || $preco <= 0) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'Informe um nome válido e um preço maior que zero.');
}

if (mb_strlen($nome, 'UTF-8') > 20) {
    redirecionarComMensagem($paginaRetorno, 'danger', 'O nome do serviço deve ter no máximo 20 caracteres.');
}

$dados = [
    'nome' => $nome,
    'preco' => $preco,
];

try {
    $conexao = conectarBanco();

    if ($idServico > 0) {
        atualizarServico($conexao, $idServico, $dados);
        redirecionarComMensagem('servicos.php', 'success', 'Serviço atualizado com sucesso.');
    } else {
        cadastrarServico($conexao, $dados);
        redirecionarComMensagem('servicos.php', 'success', 'Novo serviço cadastrado com sucesso.');
    }
} catch (Throwable $erro) {
    $acao = $idServico > 0 ? 'atualizar' : 'cadastrar';
    redirecionarComMensagem($paginaRetorno, 'danger', "Não foi possível {$acao} o serviço. Tente novamente.");
}
