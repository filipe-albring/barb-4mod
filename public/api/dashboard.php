<?php
declare(strict_types=1);

require_once '../../config/conexao.php';

header('Content-Type: application/json; charset=utf-8');

function responderJson(array $corpo, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function limparResultadosPendentes(mysqli $conexao): void
{
    while ($conexao->more_results() && $conexao->next_result()) {
        $resultadoExtra = $conexao->use_result();
        if ($resultadoExtra instanceof mysqli_result) {
            $resultadoExtra->free();
        }
    }
}

function buscarLinhasDashboard(mysqli $conexao, string $dataInicial): array
{
    $sql = 'CALL sp_obter_indicadores_dashboard(?)';
    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        throw new RuntimeException('Não foi possível preparar a chamada da procedure de indicadores.');
    }

    $stmt->bind_param('s', $dataInicial);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $linhas = $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
    limparResultadosPendentes($conexao);

    return $linhas;
}

function buscarProximosAgendamentosDashboard(mysqli $conexao, int $limite = 5, int $offset = 0): array
{
    $sql = 'CALL sp_listar_proximos_agendamentos(?, ?)';
    $stmt = $conexao->prepare($sql);

    if (!$stmt) {
        throw new RuntimeException('Não foi possível preparar a chamada da procedure de agendamentos.');
    }

    $stmt->bind_param('ii', $limite, $offset);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $linhas = $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
    limparResultadosPendentes($conexao);

    return $linhas;
}

$periodosPermitidos = [0, 7, 30, 90];
$periodo = filter_input(INPUT_GET, 'periodo', FILTER_VALIDATE_INT);
$periodo = in_array($periodo, $periodosPermitidos, true) ? $periodo : 30;

$limiteAgenda = filter_input(INPUT_GET, 'limite', FILTER_VALIDATE_INT);
$limiteAgenda = ($limiteAgenda !== false && $limiteAgenda > 0 && $limiteAgenda <= 50) ? $limiteAgenda : 5;

$paginaAgenda = filter_input(INPUT_GET, 'pagina', FILTER_VALIDATE_INT);
$paginaAgenda = ($paginaAgenda !== false && $paginaAgenda > 0) ? $paginaAgenda : 1;
$offsetAgenda = ($paginaAgenda - 1) * $limiteAgenda;

$dataInicial = $periodo === 0
    ? '1900-01-01 00:00:00'
    : (new DateTimeImmutable('today'))->modify("-{$periodo} days")->format('Y-m-d 00:00:00');

try {
    $conexao = conectarBanco();
    $itensFinanceiros = buscarLinhasDashboard($conexao, $dataInicial);
    $proximosAgendamentos = buscarProximosAgendamentosDashboard($conexao, $limiteAgenda, $offsetAgenda);
    $conexao->close();

    responderJson([
        'ok' => true,
        'periodo' => $periodo,
        'gerado_em' => (new DateTimeImmutable())->format(DATE_ATOM),
        'itens_financeiros' => $itensFinanceiros,
        'proximos_agendamentos' => $proximosAgendamentos,
    ]);
} catch (Throwable $erro) {
    error_log('Erro no dashboard: ' . $erro->getMessage());

    responderJson([
        'ok' => false,
        'mensagem' => 'Não foi possível consultar os dados do dashboard. Verifique a conexão com o banco e execute a migração analítica.',
    ], 500);
}
