import { dataHoje, numeroSeguro, statusCancelado, textoSeguro } from './formatadores.js';
function criarAcumulador() {
    return {
        faturamento: 0,
        servicos: new Map(),
        barbeiros: new Map(),
    };
}
function ordenarRanking(itens, campo) {
    return itens.sort((primeiro, segundo) => {
        const diferenca = segundo[campo] - primeiro[campo];
        return diferenca || segundo.faturamento - primeiro.faturamento;
    });
}
/**
 * Segmenta itens financeiros utilizando .filter() (Meta 9) e consolida
 * métricas e rankings da dashboard (Meta 10, Meta 11 e Meta 13).
 */
export function calcularResumo(itens) {
    const hoje = dataHoje();
    // 1. Segmentação com .filter(): Isola os itens com status cancelado
    const itensCancelados = itens.filter((item) => statusCancelado(item.status));
    // 2. Segmentação com .filter(): Isola os itens com status ativos/concluídos
    const itensAtivos = itens.filter((item) => !statusCancelado(item.status));
    // 3. Segmentação com .filter(): Isola atendimentos previstos para o dia de hoje
    const itensHoje = itensAtivos.filter((item) => item.data_agendamento === hoje);
    // Identificadores únicos para contagem de agendamentos
    const idsAgendamentosAtivos = new Set(itensAtivos.map((item) => String(item.id_agendamento)));
    const idsCancelados = new Set(itensCancelados.map((item) => String(item.id_agendamento)));
    const idsHoje = new Set(itensHoje.map((item) => String(item.id_agendamento)));
    // Processamento dos itens ativos para apuração de faturamento e rankings
    const acumulado = itensAtivos.reduce((resultado, item) => {
        const id = String(item.id_agendamento);
        const valor = numeroSeguro(item.valor_unitario);
        const servico = textoSeguro(item.servico, 'Serviço não informado');
        const barbeiro = textoSeguro(item.barbeiro, 'Barbeiro não informado');
        const dadosServico = resultado.servicos.get(servico) ?? { nome: servico, quantidade: 0, faturamento: 0 };
        const dadosBarbeiro = resultado.barbeiros.get(barbeiro) ?? {
            nome: barbeiro, quantidade: 0, faturamento: 0, agendamentos: new Set(),
        };
        resultado.faturamento += valor;
        dadosServico.quantidade += 1;
        dadosServico.faturamento += valor;
        dadosBarbeiro.faturamento += valor;
        dadosBarbeiro.agendamentos.add(id);
        dadosBarbeiro.quantidade = dadosBarbeiro.agendamentos.size;
        resultado.servicos.set(servico, dadosServico);
        resultado.barbeiros.set(barbeiro, dadosBarbeiro);
        return resultado;
    }, criarAcumulador());
    const agendamentosAtivos = idsAgendamentosAtivos.size;
    const cancelamentos = idsCancelados.size;
    const totalRegistros = agendamentosAtivos + cancelamentos;
    const taxaCancelamento = totalRegistros > 0 ? (cancelamentos / totalRegistros) * 100 : 0;
    return {
        faturamento: acumulado.faturamento,
        agendamentosAtivos,
        agendamentosHoje: idsHoje.size,
        cancelamentos,
        ticketMedio: agendamentosAtivos ? acumulado.faturamento / agendamentosAtivos : 0,
        taxaCancelamento,
        servicos: ordenarRanking([...acumulado.servicos.values()], 'quantidade'),
        barbeiros: ordenarRanking([...acumulado.barbeiros.values()], 'faturamento'),
    };
}
