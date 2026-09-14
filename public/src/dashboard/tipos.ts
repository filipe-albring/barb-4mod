export type ValorDoBanco = number | string | null;

export interface ItemFinanceiro {
    id_agendamento: number | string;
    data_agendamento: string;
    horario: string;
    status: string;
    cliente: string;
    barbeiro: string;
    servico: string;
    valor_unitario: ValorDoBanco;
}

export interface ProximoAgendamento {
    id_agendamento: number | string;
    data_hora: string;
    status: string;
    cliente: string;
    barbeiro: string;
    servicos: string;
    valor_total: ValorDoBanco;
}

export interface RespostaDashboard {
    ok: boolean;
    periodo?: number;
    mensagem?: string;
    gerado_em?: string;
    itens_financeiros?: ItemFinanceiro[];
    proximos_agendamentos?: ProximoAgendamento[];
}

export interface ItemRanking {
    nome: string;
    quantidade: number;
    faturamento: number;
}

export interface ResumoDashboard {
    faturamento: number;
    agendamentosAtivos: number;
    agendamentosHoje: number;
    cancelamentos: number;
    ticketMedio: number;
    taxaCancelamento: number;
    servicos: ItemRanking[];
    barbeiros: ItemRanking[];
}

