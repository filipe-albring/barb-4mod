-- Funções no banco de dados para reutilização de scripts
DROP FUNCTION IF EXISTS `fn_calcular_total_agendamento`;
DROP FUNCTION IF EXISTS `fn_normalizar_status`;

DELIMITER $$
CREATE FUNCTION `fn_calcular_total_agendamento`(p_id_agendamento INT UNSIGNED)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10, 2);

    SELECT COALESCE(SUM(GREATEST(ABS(s.`vl_preco`), 0.00)), 0.00)
    INTO v_total
    FROM `Agendamento_Servico` AS ags
    INNER JOIN `Servico` AS s ON s.`id_servico` = ags.`id_servico`
    WHERE ags.`id_agendamento` = p_id_agendamento;

    RETURN COALESCE(v_total, 0.00);
END$$

CREATE FUNCTION `fn_normalizar_status`(p_status VARCHAR(50))
RETURNS VARCHAR(20)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_limpo VARCHAR(50);
    SET v_limpo = UPPER(TRIM(COALESCE(p_status, '')));

    IF v_limpo IN ('CANCELADO', 'CANCELADA') THEN
        RETURN 'Cancelado';
    ELSEIF v_limpo IN ('CONCLUIDO', 'CONCLUÍDO', 'FINALIZADO', 'FINALIZADA') THEN
        RETURN 'Concluído';
    ELSEIF v_limpo = 'AGENDADO' THEN
        RETURN 'Agendado';
    ELSEIF v_limpo = '' THEN
        RETURN 'Pendente';
    ELSE
        RETURN TRIM(p_status);
    END IF;
END$$
DELIMITER ;

-- Stored Procedures para centralizar busca, filtros e paginação da dashboard
DROP PROCEDURE IF EXISTS `sp_obter_indicadores_dashboard`;
DROP PROCEDURE IF EXISTS `sp_listar_proximos_agendamentos`;

DELIMITER $$
CREATE PROCEDURE `sp_obter_indicadores_dashboard`(
    IN p_data_inicial DATETIME
)
BEGIN
    SELECT
        id_agendamento,
        DATE_FORMAT(dt_hora, '%Y-%m-%d') AS data_agendamento,
        DATE_FORMAT(dt_hora, '%H:%i') AS horario,
        status,
        cliente,
        barbeiro,
        servico,
        CAST(COALESCE(valor_unitario, 0) AS DECIMAL(10, 2)) AS valor_unitario
    FROM `vw_dashboard_itens_financeiros`
    WHERE dt_hora >= p_data_inicial
    ORDER BY dt_hora DESC, id_agendamento DESC;
END$$

CREATE PROCEDURE `sp_listar_proximos_agendamentos`(
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limite INT DEFAULT 5;
    DECLARE v_offset INT DEFAULT 0;

    IF p_limite IS NOT NULL AND p_limite > 0 THEN
        SET v_limite = p_limite;
    END IF;

    IF p_offset IS NOT NULL AND p_offset >= 0 THEN
        SET v_offset = p_offset;
    END IF;

    SELECT
        id_agendamento,
        DATE_FORMAT(dt_hora, '%d/%m/%Y %H:%i') AS data_hora,
        status,
        cliente,
        barbeiro,
        servicos,
        CAST(COALESCE(valor_total, 0) AS DECIMAL(10, 2)) AS valor_total
    FROM `vw_dashboard_agendamentos`
    WHERE dt_hora >= NOW()
        AND status <> 'Cancelado'
    ORDER BY dt_hora ASC
    LIMIT v_limite OFFSET v_offset;
END$$
DELIMITER ;
