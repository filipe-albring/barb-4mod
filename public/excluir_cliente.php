<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idCliente = (int) ($_POST['id_cliente'] ?? 0);

if ($idCliente <= 0) {
    redirecionarComMensagem('clientes.php', 'danger', 'Cliente não informado para exclusão.');
}

$conexao = conectarBanco();
$resultado = excluirCliente($conexao, $idCliente);

$tipo = $resultado['sucesso'] ? 'success' : 'danger';
redirecionarComMensagem('clientes.php', $tipo, $resultado['mensagem']);
