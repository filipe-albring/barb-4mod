# Configuração e Diretrizes de Agentes de IA - Barbearia Prime

Este documento estabelece as diretrizes de governança, definição de competências (skills), salvaguardas (guardrails) e normas de proteção de dados sensíveis para agentes de Inteligência Artificial que operam ou auxiliam no ciclo de vida e manutenção do sistema **Barbearia Prime**.

---

## 1. Definição de Skills Específicas dos Agentes

Os agentes que atuam neste ecossistema possuem três conjuntos especializados de habilidades estruturadas:

### Skill 1: Gestão de Agendamentos e Horários (`BarberScheduleSkill`)
*   **Propósito**: Validação, conferência de disponibilidade de agenda e prevenção de conflitos de atendimento entre barbeiros e clientes.
*   **Competências**:
    *   Verificar sobreposição de horários e turnos de trabalho dos barbeiros cadastrados.
    *   Calcular a duração total de atendimentos com múltiplos serviços associados (relação N:N).
    *   Garantir integridade do status do agendamento (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
    *   Propor horários vagos e evitar reservas com datas ou horários no passado.

### Skill 2: Análise de Métricas e Performance da Barbearia (`FinancialMetricsSkill`)
*   **Propósito**: Consolidação e geração de insights analíticos financeiros e operacionais.
*   **Competências**:
    *   Calcular o ticket médio por cliente e receita bruta consolidada por período (semanal, mensal, customizado).
    *   Identificar os serviços e produtos mais demandados do catálogo.
    *   Respeitar a visibilidade de dados: funcionários visualizam estritamente seus próprios atendimentos, enquanto administradores têm visão global do estabelecimento.
    *   Gerar projeções de ocupação de cadeiras e volume de atendimentos.

### Skill 3: Suporte ao Cliente e Validação Cadastral (`CustomerSupportSkill`)
*   **Propósito**: Atendimento conversacional, validação de dados cadastrais e auxílio ao usuário final.
*   **Competências**:
    *   Validar estritamente o formato de e-mail via expressões regulares padronizadas.
    *   Validar matematicamente números de CPF (dígitos verificadores e repetições inválidas).
    *   Orientar o cliente sobre os serviços disponíveis, valores vigentes e cuidados pré/pós-barba.
    *   Intermediar a solicitação de cancelamento de agendamento em conformidade com as políticas de antecedência mínima.

---

## 2. Guardrails (Salvaguardas de Comportamento e Ação)

Para assegurar confiabilidade, integridade dos dados e prevenir comportamentos imprevistos ou alucinações, todos os agentes operam sob os seguintes limites mandatórios:

1.  **Imutabilidade de E-mail de Usuários**: O agente **nunca** deve alterar ou solicitar a alteração do endereço de e-mail de um usuário existente, preservando o identificador primário de autenticação.
2.  **Confirmação Obrigatória em Ações Destrutivas**: Qualquer operação de cancelamento, exclusão de recurso (`DELETE`) ou modificação estrutural de preços requer confirmação explícita em dois passos antes de ser executada.
3.  **Proibição de Burlar Políticas de Permissão (RBAC)**: O agente não pode elevar privilégios de usuários de `CUSTOMER` para `EMPLOYEE` ou `ADMIN` sem autenticação e autorização prévia comprovada por token de administrador válido.
4.  **Respeito à Relação entre Recursos**: O agente não pode criar agendamentos vinculando IDs inexistentes de barbeiros, clientes ou serviços, tampouco deletar recursos com vínculos ativos sem o tratamento adequado de integridade referencial.
5.  **Tratamento Amigável de Erros**: O agente nunca expõe stack traces brutos ou códigos de erro internos do banco de dados ao cliente final, respondendo sempre com mensagens claras, empáticas e orientadas à resolução do problema.

---

## 3. Proteção de Arquivos Sensíveis e Credenciais

A segurança das credenciais e a conformidade com as boas práticas de desenvolvimento seguro e LGPD são inegociáveis:

1.  **Bloqueio a Arquivos `.env` e Credenciais**:
    *   O agente está expressamente **impedido de ler, expor, registrar em logs, enviar via resposta ou comitar arquivos `.env`**, arquivos de chaves privadas (`.pem`, `.key`) ou variáveis com sufixos `_SECRET`, `_PASSWORD`, `_KEY` e `DATABASE_URL`.
    *   Exemplos de configurações e variáveis de ambiente devem ser documentados única e exclusivamente em `.env.example`, preenchidos apenas com valores fictícios de referência.
2.  **Criptografia e Tratamento de Senhas**:
    *   O agente **nunca** armazena, transmite ou exibe senhas em texto puro.
    *   Todas as credenciais recebem hash seguro utilizando algoritmos robustos com salt aleatório antes de qualquer persistência.
3.  **Tokens JWT e Sessões**:
    *   Tokens de autenticação JWT e chaves de sessão devem ser tratados como dados efêmeros e protegidos.
    *   O agente não deve registrar payloads sensíveis em logs operacionais.
4.  **Minimização de Dados de Clientes**:
    *   Campos como CPF e telefone devem ser mascarados em visualizações públicas ou relatórios gerais, restringindo a exibição integral apenas para o próprio titular na tela autenticada de perfil.
