<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idServico = (int) ($_POST['id_servico'] ?? 0);

if ($idServico <= 0) {
    redirecionarComMensagem('servicos.php', 'danger', 'Serviço não informado para exclusão.');
}

$conexao = conectarBanco();
$resultado = excluirServico($conexao, $idServico);

$tipo = $resultado['sucesso'] ? 'success' : 'danger';
redirecionarComMensagem('servicos.php', $tipo, $resultado['mensagem']);
