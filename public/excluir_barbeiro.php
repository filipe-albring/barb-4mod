<?php
require_once '../config/conexao.php';
require_once '../includes/funcoes.php';

$idBarbeiro = (int) ($_POST['id_barbeiro'] ?? 0);

if ($idBarbeiro <= 0) {
    redirecionarComMensagem('barbeiros.php', 'danger', 'Barbeiro não informado para exclusão.');
}

$conexao = conectarBanco();
$resultado = excluirBarbeiro($conexao, $idBarbeiro);

$tipo = $resultado['sucesso'] ? 'success' : 'danger';
redirecionarComMensagem('barbeiros.php', $tipo, $resultado['mensagem']);
