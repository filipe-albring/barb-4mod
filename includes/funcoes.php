<?php

function buscarServicos(mysqli $conexao): array
{
    $servicos = [];
    $sql = 'SELECT id_servico, nm_servico, vl_preco FROM Servico ORDER BY nm_servico';
    $resultado = $conexao->query($sql);

    if ($resultado) {
        while ($servico = $resultado->fetch_assoc()) {
            $servicos[] = $servico;
        }
    }

    return $servicos;
}

function buscarBarbeiros(mysqli $conexao): array
{
    $barbeiros = [];
    $sql = "
        SELECT
            b.id_barbeiro,
            b.nm_barbeiro,
            GROUP_CONCAT(DISTINCT be.nm_email ORDER BY be.nm_email SEPARATOR ', ') AS emails,
            GROUP_CONCAT(DISTINCT bt.nr_telefone ORDER BY bt.nr_telefone SEPARATOR ', ') AS telefones
        FROM Barbeiro b
        LEFT JOIN Barbeiro_Email be ON be.id_barbeiro = b.id_barbeiro
        LEFT JOIN Barbeiro_Telefone bt ON bt.id_barbeiro = b.id_barbeiro
        GROUP BY b.id_barbeiro, b.nm_barbeiro
        ORDER BY b.nm_barbeiro
    ";
    $resultado = $conexao->query($sql);

    if ($resultado) {
        while ($barbeiro = $resultado->fetch_assoc()) {
            $barbeiros[] = $barbeiro;
        }
    }

    return $barbeiros;
}

function buscarClientes(mysqli $conexao): array
{
    $clientes = [];
    $sql = 'SELECT id_cliente, nm_cliente, cpf_cliente FROM Cliente ORDER BY nm_cliente';
    $resultado = $conexao->query($sql);

    if ($resultado) {
        while ($cliente = $resultado->fetch_assoc()) {
            $clientes[] = $cliente;
        }
    }

    return $clientes;
}

function buscarClientePorIdentificacao(mysqli $conexao, string $identificacao): ?array
{
    $identificacao = trim($identificacao);
    $identificacaoNumerica = somenteNumeros($identificacao);

    $sql = "
        SELECT DISTINCT c.id_cliente, c.nm_cliente, c.cpf_cliente
        FROM Cliente c
        LEFT JOIN Cliente_Email ce ON ce.id_cliente = c.id_cliente
        LEFT JOIN Cliente_Telefone ct ON ct.id_cliente = c.id_cliente
        WHERE c.cpf_cliente = ?
            OR REPLACE(REPLACE(REPLACE(c.cpf_cliente, '.', ''), '-', ''), ' ', '') = ?
            OR LOWER(ce.nm_email) = LOWER(?)
            OR ct.nr_telefone = ?
            OR REPLACE(REPLACE(REPLACE(REPLACE(ct.nr_telefone, '(', ''), ')', ''), '-', ''), ' ', '') = ?
        LIMIT 1
    ";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('sssss', $identificacao, $identificacaoNumerica, $identificacao, $identificacao, $identificacaoNumerica);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $cliente = $resultado->fetch_assoc();

    if ($cliente) {
        return $cliente;
    }

    return null;
}

function listarProximosAgendamentos(mysqli $conexao): array
{
    $agendamentos = [];
    $sql = "
        SELECT
            a.id_agendamento,
            a.dt_hora,
            a.status,
            c.nm_cliente,
            b.nm_barbeiro,
            GROUP_CONCAT(s.nm_servico ORDER BY s.nm_servico SEPARATOR ', ') AS servicos
        FROM Agendamento a
        INNER JOIN Cliente c ON c.id_cliente = a.id_cliente
        INNER JOIN Barbeiro b ON b.id_barbeiro = a.id_barbeiro
        INNER JOIN Agendamento_Servico ags ON ags.id_agendamento = a.id_agendamento
        INNER JOIN Servico s ON s.id_servico = ags.id_servico
        WHERE a.dt_hora >= NOW()
        GROUP BY a.id_agendamento, a.dt_hora, a.status, c.nm_cliente, b.nm_barbeiro
        ORDER BY a.dt_hora ASC
    ";
    $resultado = $conexao->query($sql);

    if ($resultado) {
        while ($agendamento = $resultado->fetch_assoc()) {
            $agendamentos[] = $agendamento;
        }
    }

    return $agendamentos;
}

function listarProximosAgendamentosCliente(mysqli $conexao, int $idCliente): array
{
    $agendamentos = [];
    $sql = "
        SELECT
            a.id_agendamento,
            a.dt_hora,
            a.status,
            c.nm_cliente,
            b.nm_barbeiro,
            GROUP_CONCAT(s.nm_servico ORDER BY s.nm_servico SEPARATOR ', ') AS servicos
        FROM Agendamento a
        INNER JOIN Cliente c ON c.id_cliente = a.id_cliente
        INNER JOIN Barbeiro b ON b.id_barbeiro = a.id_barbeiro
        INNER JOIN Agendamento_Servico ags ON ags.id_agendamento = a.id_agendamento
        INNER JOIN Servico s ON s.id_servico = ags.id_servico
        WHERE a.dt_hora >= NOW()
            AND a.id_cliente = ?
            AND a.status <> 'Cancelado'
        GROUP BY a.id_agendamento, a.dt_hora, a.status, c.nm_cliente, b.nm_barbeiro
        ORDER BY a.dt_hora ASC
    ";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('i', $idCliente);
    $stmt->execute();
    $resultado = $stmt->get_result();

    while ($agendamento = $resultado->fetch_assoc()) {
        $agendamentos[] = $agendamento;
    }

    return $agendamentos;
}

function cancelarAgendamentoCliente(mysqli $conexao, int $idAgendamento, int $idCliente): bool
{
    $status = 'Cancelado';
    $sql = "
        UPDATE Agendamento
        SET status = ?
        WHERE id_agendamento = ?
            AND id_cliente = ?
            AND dt_hora >= NOW()
            AND status <> 'Cancelado'
    ";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('sii', $status, $idAgendamento, $idCliente);
    $stmt->execute();

    return $stmt->affected_rows > 0;
}

function cadastrarCliente(mysqli $conexao, array $dados): int
{
    $conexao->begin_transaction();

    try {
        $sqlCliente = 'INSERT INTO Cliente (nm_cliente, dt_nascimento, cpf_cliente) VALUES (?, ?, ?)';
        $stmtCliente = $conexao->prepare($sqlCliente);
        $stmtCliente->bind_param('sss', $dados['nome'], $dados['data_nascimento'], $dados['cpf']);
        $stmtCliente->execute();

        $idCliente = $conexao->insert_id;

        $sqlEmail = 'INSERT INTO Cliente_Email (nm_email, id_cliente) VALUES (?, ?)';
        $stmtEmail = $conexao->prepare($sqlEmail);
        $stmtEmail->bind_param('si', $dados['email'], $idCliente);
        $stmtEmail->execute();

        $sqlTelefone = 'INSERT INTO Cliente_Telefone (nr_telefone, id_cliente) VALUES (?, ?)';
        $stmtTelefone = $conexao->prepare($sqlTelefone);
        $stmtTelefone->bind_param('si', $dados['telefone'], $idCliente);
        $stmtTelefone->execute();

        $conexao->commit();
        return $idCliente;
    } catch (Throwable $erro) {
        $conexao->rollback();
        throw $erro;
    }
}

function criarAgendamento(mysqli $conexao, int $idCliente, int $idBarbeiro, string $dataHora, array $idsServicos): int
{
    $status = 'Agendado';
    $conexao->begin_transaction();

    try {
        $sqlAgendamento = 'INSERT INTO Agendamento (dt_hora, status, id_cliente, id_barbeiro) VALUES (?, ?, ?, ?)';
        $stmtAgendamento = $conexao->prepare($sqlAgendamento);
        $stmtAgendamento->bind_param('ssii', $dataHora, $status, $idCliente, $idBarbeiro);
        $stmtAgendamento->execute();

        $idAgendamento = $conexao->insert_id;
        $sqlServico = 'INSERT INTO Agendamento_Servico (id_agendamento, id_servico) VALUES (?, ?)';
        $stmtServico = $conexao->prepare($sqlServico);

        foreach ($idsServicos as $idServico) {
            $idServico = (int) $idServico;
            $stmtServico->bind_param('ii', $idAgendamento, $idServico);
            $stmtServico->execute();
        }

        $conexao->commit();
        return $idAgendamento;
    } catch (Throwable $erro) {
        $conexao->rollback();
        throw $erro;
    }
}

function formatarMoeda(float $valor): string
{
    return 'R$ ' . number_format($valor, 2, ',', '.');
}

function formatarDataHora(string $dataHora): string
{
    return date('d/m/Y H:i', strtotime($dataHora));
}

function converterDataHoraBrasileiraParaMysql(string $data, string $hora): ?string
{
    $dataHora = DateTime::createFromFormat('d/m/Y H:i', trim($data) . ' ' . trim($hora));

    if (!$dataHora || $dataHora->format('d/m/Y H:i') !== trim($data) . ' ' . trim($hora)) {
        return null;
    }

    return $dataHora->format('Y-m-d H:i:s');
}

function converterDataBrasileiraParaMysql(string $data): ?string
{
    $dataConvertida = DateTime::createFromFormat('d/m/Y', trim($data));

    if (!$dataConvertida || $dataConvertida->format('d/m/Y') !== trim($data)) {
        return null;
    }

    return $dataConvertida->format('Y-m-d');
}

function campoObrigatorio(string $valor): bool
{
    return trim($valor) !== '';
}

function idExisteNoArray(array $itens, int $id, string $campoId): bool
{
    foreach ($itens as $item) {
        if ((int) $item[$campoId] === $id) {
            return true;
        }
    }

    return false;
}

function limparTexto(string $valor): string
{
    return htmlspecialchars(trim($valor), ENT_QUOTES, 'UTF-8');
}

function somenteNumeros(string $valor): string
{
    return preg_replace('/\D/', '', $valor);
}

function redirecionarComMensagem(string $pagina, string $tipo, string $mensagem, array $extras = []): void
{
    $parametros = http_build_query([
        'tipo' => $tipo,
        'mensagem' => $mensagem,
    ] + $extras);

    header("Location: {$pagina}?{$parametros}");
    exit;
}

// -------------------------------------------------------------
// OPERAÇÕES COMPLETAS DE CRUD: CLIENTES (Meta 6 e Meta 7)
// -------------------------------------------------------------

function buscarClientesCompletos(mysqli $conexao, string $termo = ''): array
{
    $termo = trim($termo);
    $termoNumerico = somenteNumeros($termo);

    $sql = "
        SELECT
            c.id_cliente,
            c.nm_cliente,
            c.cpf_cliente,
            c.dt_nascimento,
            GROUP_CONCAT(DISTINCT ce.nm_email ORDER BY ce.id_email SEPARATOR ', ') AS email,
            GROUP_CONCAT(DISTINCT ct.nr_telefone ORDER BY ct.id_telefone SEPARATOR ', ') AS telefone,
            (SELECT COUNT(*) FROM Agendamento a WHERE a.id_cliente = c.id_cliente) AS total_agendamentos
        FROM Cliente c
        LEFT JOIN Cliente_Email ce ON ce.id_cliente = c.id_cliente
        LEFT JOIN Cliente_Telefone ct ON ct.id_cliente = c.id_cliente
    ";

    if ($termo !== '') {
        $sql .= "
            WHERE c.nm_cliente LIKE ?
                OR c.cpf_cliente LIKE ?
                OR REPLACE(REPLACE(REPLACE(c.cpf_cliente, '.', ''), '-', ''), ' ', '') LIKE ?
                OR ce.nm_email LIKE ?
                OR ct.nr_telefone LIKE ?
        ";
    }

    $sql .= "
        GROUP BY c.id_cliente, c.nm_cliente, c.cpf_cliente, c.dt_nascimento
        ORDER BY c.nm_cliente ASC
    ";

    $clientes = [];

    if ($termo !== '') {
        $paramLike = "%{$termo}%";
        $paramNumLike = "%{$termoNumerico}%";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param('sssss', $paramLike, $paramLike, $paramNumLike, $paramLike, $paramLike);
        $stmt->execute();
        $resultado = $stmt->get_result();
    } else {
        $resultado = $conexao->query($sql);
    }

    if ($resultado) {
        while ($linha = $resultado->fetch_assoc()) {
            $clientes[] = $linha;
        }
    }

    return $clientes;
}

function buscarClientePorId(mysqli $conexao, int $idCliente): ?array
{
    $sql = "
        SELECT
            c.id_cliente,
            c.nm_cliente,
            c.cpf_cliente,
            c.dt_nascimento,
            (SELECT nm_email FROM Cliente_Email ce WHERE ce.id_cliente = c.id_cliente ORDER BY ce.id_email ASC LIMIT 1) AS email,
            (SELECT nr_telefone FROM Cliente_Telefone ct WHERE ct.id_cliente = c.id_cliente ORDER BY ct.id_telefone ASC LIMIT 1) AS telefone
        FROM Cliente c
        WHERE c.id_cliente = ?
        LIMIT 1
    ";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('i', $idCliente);
    $stmt->execute();
    $resultado = $stmt->get_result();

    return $resultado->fetch_assoc() ?: null;
}

function atualizarCliente(mysqli $conexao, int $idCliente, array $dados): bool
{
    $conexao->begin_transaction();

    try {
        $sqlCliente = 'UPDATE Cliente SET nm_cliente = ?, dt_nascimento = ?, cpf_cliente = ? WHERE id_cliente = ?';
        $stmtCliente = $conexao->prepare($sqlCliente);
        $stmtCliente->bind_param('sssi', $dados['nome'], $dados['data_nascimento'], $dados['cpf'], $idCliente);
        $stmtCliente->execute();

        // Atualiza ou insere e-mail
        $conexao->query("DELETE FROM Cliente_Email WHERE id_cliente = {$idCliente}");
        $sqlEmail = 'INSERT INTO Cliente_Email (nm_email, id_cliente) VALUES (?, ?)';
        $stmtEmail = $conexao->prepare($sqlEmail);
        $stmtEmail->bind_param('si', $dados['email'], $idCliente);
        $stmtEmail->execute();

        // Atualiza ou insere telefone
        $conexao->query("DELETE FROM Cliente_Telefone WHERE id_cliente = {$idCliente}");
        $sqlTelefone = 'INSERT INTO Cliente_Telefone (nr_telefone, id_cliente) VALUES (?, ?)';
        $stmtTelefone = $conexao->prepare($sqlTelefone);
        $stmtTelefone->bind_param('si', $dados['telefone'], $idCliente);
        $stmtTelefone->execute();

        $conexao->commit();
        return true;
    } catch (Throwable $erro) {
        $conexao->rollback();
        throw $erro;
    }
}

function excluirCliente(mysqli $conexao, int $idCliente): array
{
    $stmtVerifica = $conexao->prepare('SELECT COUNT(*) AS total FROM Agendamento WHERE id_cliente = ?');
    $stmtVerifica->bind_param('i', $idCliente);
    $stmtVerifica->execute();
    $totalAgendamentos = (int) ($stmtVerifica->get_result()->fetch_assoc()['total'] ?? 0);

    if ($totalAgendamentos > 0) {
        return [
            'sucesso' => false,
            'mensagem' => "Não é possível excluir o cliente porque constam {$totalAgendamentos} agendamento(s) vinculado(s) ao seu cadastro. Remova ou conclua os agendamentos antes de excluir.",
        ];
    }

    $conexao->begin_transaction();

    try {
        $conexao->query("DELETE FROM Cliente_Email WHERE id_cliente = {$idCliente}");
        $conexao->query("DELETE FROM Cliente_Telefone WHERE id_cliente = {$idCliente}");
        $conexao->query("DELETE FROM Cliente WHERE id_cliente = {$idCliente}");
        $conexao->commit();

        return [
            'sucesso' => true,
            'mensagem' => 'Cliente e seus dados de contato foram excluídos com sucesso.',
        ];
    } catch (Throwable $erro) {
        $conexao->rollback();
        return [
            'sucesso' => false,
            'mensagem' => 'Erro ao excluir o cliente: ' . $erro->getMessage(),
        ];
    }
}

// -------------------------------------------------------------
// OPERAÇÕES COMPLETAS DE CRUD: SERVIÇOS (Meta 6 e Meta 7)
// -------------------------------------------------------------

function buscarServicoPorId(mysqli $conexao, int $idServico): ?array
{
    $sql = 'SELECT id_servico, nm_servico, vl_preco FROM Servico WHERE id_servico = ? LIMIT 1';
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('i', $idServico);
    $stmt->execute();
    $resultado = $stmt->get_result();

    return $resultado->fetch_assoc() ?: null;
}

function cadastrarServico(mysqli $conexao, array $dados): int
{
    $sql = 'INSERT INTO Servico (nm_servico, vl_preco) VALUES (?, ?)';
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('sd', $dados['nome'], $dados['preco']);
    $stmt->execute();

    return $conexao->insert_id;
}

function atualizarServico(mysqli $conexao, int $idServico, array $dados): bool
{
    $sql = 'UPDATE Servico SET nm_servico = ?, vl_preco = ? WHERE id_servico = ?';
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('sdi', $dados['nome'], $dados['preco'], $idServico);
    return $stmt->execute();
}

function excluirServico(mysqli $conexao, int $idServico): array
{
    $stmtVerifica = $conexao->prepare('SELECT COUNT(*) AS total FROM Agendamento_Servico WHERE id_servico = ?');
    $stmtVerifica->bind_param('i', $idServico);
    $stmtVerifica->execute();
    $totalVinculos = (int) ($stmtVerifica->get_result()->fetch_assoc()['total'] ?? 0);

    if ($totalVinculos > 0) {
        return [
            'sucesso' => false,
            'mensagem' => "Não é possível excluir este serviço porque ele está vinculado a {$totalVinculos} agendamento(s) no sistema.",
        ];
    }

    $stmt = $conexao->prepare('DELETE FROM Servico WHERE id_servico = ?');
    $stmt->bind_param('i', $idServico);

    if ($stmt->execute()) {
        return [
            'sucesso' => true,
            'mensagem' => 'Serviço excluído com sucesso.',
        ];
    }

    return [
        'sucesso' => false,
        'mensagem' => 'Não foi possível excluir o serviço selecionado.',
    ];
}

// -------------------------------------------------------------
// OPERAÇÕES COMPLETAS DE CRUD: BARBEIROS (Meta 6 e Meta 7)
// -------------------------------------------------------------

function buscarBarbeiroPorId(mysqli $conexao, int $idBarbeiro): ?array
{
    $sql = "
        SELECT
            b.id_barbeiro,
            b.nm_barbeiro,
            b.cpf_barbeiro,
            (SELECT nm_email FROM Barbeiro_Email be WHERE be.id_barbeiro = b.id_barbeiro ORDER BY be.id_email ASC LIMIT 1) AS email,
            (SELECT nr_telefone FROM Barbeiro_Telefone bt WHERE bt.id_barbeiro = b.id_barbeiro ORDER BY bt.id_telefone ASC LIMIT 1) AS telefone
        FROM Barbeiro b
        WHERE b.id_barbeiro = ?
        LIMIT 1
    ";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('i', $idBarbeiro);
    $stmt->execute();
    $resultado = $stmt->get_result();

    return $resultado->fetch_assoc() ?: null;
}

function cadastrarBarbeiro(mysqli $conexao, array $dados): int
{
    $conexao->begin_transaction();

    try {
        $sql = 'INSERT INTO Barbeiro (nm_barbeiro, cpf_barbeiro) VALUES (?, ?)';
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param('ss', $dados['nome'], $dados['cpf']);
        $stmt->execute();
        $idBarbeiro = $conexao->insert_id;

        if (campoObrigatorio($dados['email'] ?? '')) {
            $stmtEmail = $conexao->prepare('INSERT INTO Barbeiro_Email (nm_email, id_barbeiro) VALUES (?, ?)');
            $stmtEmail->bind_param('si', $dados['email'], $idBarbeiro);
            $stmtEmail->execute();
        }

        if (campoObrigatorio($dados['telefone'] ?? '')) {
            $stmtTel = $conexao->prepare('INSERT INTO Barbeiro_Telefone (nr_telefone, id_barbeiro) VALUES (?, ?)');
            $stmtTel->bind_param('si', $dados['telefone'], $idBarbeiro);
            $stmtTel->execute();
        }

        $conexao->commit();
        return $idBarbeiro;
    } catch (Throwable $erro) {
        $conexao->rollback();
        throw $erro;
    }
}

function atualizarBarbeiro(mysqli $conexao, int $idBarbeiro, array $dados): bool
{
    $conexao->begin_transaction();

    try {
        $sql = 'UPDATE Barbeiro SET nm_barbeiro = ?, cpf_barbeiro = ? WHERE id_barbeiro = ?';
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param('ssi', $dados['nome'], $dados['cpf'], $idBarbeiro);
        $stmt->execute();

        $conexao->query("DELETE FROM Barbeiro_Email WHERE id_barbeiro = {$idBarbeiro}");
        if (campoObrigatorio($dados['email'] ?? '')) {
            $stmtEmail = $conexao->prepare('INSERT INTO Barbeiro_Email (nm_email, id_barbeiro) VALUES (?, ?)');
            $stmtEmail->bind_param('si', $dados['email'], $idBarbeiro);
            $stmtEmail->execute();
        }

        $conexao->query("DELETE FROM Barbeiro_Telefone WHERE id_barbeiro = {$idBarbeiro}");
        if (campoObrigatorio($dados['telefone'] ?? '')) {
            $stmtTel = $conexao->prepare('INSERT INTO Barbeiro_Telefone (nr_telefone, id_barbeiro) VALUES (?, ?)');
            $stmtTel->bind_param('si', $dados['telefone'], $idBarbeiro);
            $stmtTel->execute();
        }

        $conexao->commit();
        return true;
    } catch (Throwable $erro) {
        $conexao->rollback();
        throw $erro;
    }
}

function excluirBarbeiro(mysqli $conexao, int $idBarbeiro): array
{
    $stmtVerifica = $conexao->prepare('SELECT COUNT(*) AS total FROM Agendamento WHERE id_barbeiro = ?');
    $stmtVerifica->bind_param('i', $idBarbeiro);
    $stmtVerifica->execute();
    $totalAgendamentos = (int) ($stmtVerifica->get_result()->fetch_assoc()['total'] ?? 0);

    if ($totalAgendamentos > 0) {
        return [
            'sucesso' => false,
            'mensagem' => "Não é possível excluir o profissional pois constam {$totalAgendamentos} agendamento(s) vinculado(s) a ele no sistema.",
        ];
    }

    $conexao->begin_transaction();

    try {
        $conexao->query("DELETE FROM Barbeiro_Email WHERE id_barbeiro = {$idBarbeiro}");
        $conexao->query("DELETE FROM Barbeiro_Telefone WHERE id_barbeiro = {$idBarbeiro}");
        $conexao->query("DELETE FROM Barbeiro WHERE id_barbeiro = {$idBarbeiro}");
        $conexao->commit();

        return [
            'sucesso' => true,
            'mensagem' => 'Barbeiro excluído com sucesso.',
        ];
    } catch (Throwable $erro) {
        $conexao->rollback();
        return [
            'sucesso' => false,
            'mensagem' => 'Erro ao excluir o barbeiro: ' . $erro->getMessage(),
        ];
    }
}

