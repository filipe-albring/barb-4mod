-- Objetos analíticos usados pelo dashboard.
DROP TRIGGER IF EXISTS `trg_servico_preco_positivo_bi`;
DROP TRIGGER IF EXISTS `trg_servico_preco_positivo_bu`;

CREATE TRIGGER `trg_servico_preco_positivo_bi`
BEFORE INSERT ON `Servico`
FOR EACH ROW
    SET NEW.`vl_preco` = CASE
        WHEN NEW.`vl_preco` IS NULL OR NEW.`vl_preco` = 0 THEN 0.01
        ELSE ABS(NEW.`vl_preco`)
    END;

CREATE TRIGGER `trg_servico_preco_positivo_bu`
BEFORE UPDATE ON `Servico`
FOR EACH ROW
    SET NEW.`vl_preco` = CASE
        WHEN NEW.`vl_preco` IS NULL OR NEW.`vl_preco` = 0 THEN 0.01
        ELSE ABS(NEW.`vl_preco`)
    END;

CREATE OR REPLACE VIEW `vw_dashboard_itens_financeiros` AS
SELECT
    a.`id_agendamento`,
    a.`dt_hora`,
    CASE
        WHEN UPPER(TRIM(a.`status`)) IN ('CANCELADO', 'CANCELADA') THEN 'Cancelado'
        WHEN UPPER(TRIM(a.`status`)) IN ('CONCLUIDO', 'CONCLUÍDO', 'FINALIZADO', 'FINALIZADA') THEN 'Concluído'
        WHEN UPPER(TRIM(a.`status`)) = 'AGENDADO' THEN 'Agendado'
        WHEN a.`status` IS NULL OR TRIM(a.`status`) = '' THEN 'Pendente'
        ELSE TRIM(a.`status`)
    END AS `status`,
    COALESCE(NULLIF(TRIM(c.`nm_cliente`), ''), 'Cliente não identificado') AS `cliente`,
    COALESCE(NULLIF(TRIM(b.`nm_barbeiro`), ''), 'Barbeiro não informado') AS `barbeiro`,
    s.`id_servico`,
    COALESCE(NULLIF(TRIM(s.`nm_servico`), ''), 'Serviço não informado') AS `servico`,
    CASE
        WHEN s.`vl_preco` IS NULL THEN CAST(0.00 AS DECIMAL(10, 2))
        ELSE GREATEST(ABS(s.`vl_preco`), 0.00)
    END AS `valor_unitario`
FROM `Agendamento` AS a
INNER JOIN `Cliente` AS c ON c.`id_cliente` = a.`id_cliente`
INNER JOIN `Barbeiro` AS b ON b.`id_barbeiro` = a.`id_barbeiro`
LEFT JOIN `Agendamento_Servico` AS ags ON ags.`id_agendamento` = a.`id_agendamento`
LEFT JOIN `Servico` AS s ON s.`id_servico` = ags.`id_servico`;

CREATE OR REPLACE VIEW `vw_dashboard_agendamentos` AS
SELECT
    `id_agendamento`,
    MIN(`dt_hora`) AS `dt_hora`,
    MIN(`status`) AS `status`,
    MIN(`cliente`) AS `cliente`,
    MIN(`barbeiro`) AS `barbeiro`,
    COUNT(DISTINCT `id_servico`) AS `quantidade_servicos`,
    COALESCE(SUM(`valor_unitario`), 0.00) AS `valor_total`,
    GROUP_CONCAT(DISTINCT `servico` ORDER BY `servico` SEPARATOR ', ') AS `servicos`
FROM `vw_dashboard_itens_financeiros`
GROUP BY `id_agendamento`;
