# 🎯 Estratégia de Teste: E-Commerce Checkout Flow

## 1. 🔍 Visão Geral da Arquitetura

### Componentes AWS Identificados
- **API Gateway**: Ponto de entrada para requisições HTTP de checkout
- **Lambda Checkout**: Orquestrador de lógica de processamento de pedidos
- **DynamoDB Orders**: Persistência de dados de pedidos em tempo real

### Fluxos de Integração
1. **Request → API Gateway**: Recebimento da requisição de checkout
2. **API Gateway → Lambda Checkout**: Encaminhamento de payload para processamento
3. **Lambda Checkout → DynamoDB Orders**: Persistência do pedido criado
4. **DynamoDB Orders → Lambda Checkout**: Retorno do status do pedido
5. **Lambda Checkout → API Gateway**: Resposta final ao cliente

---

## 2. ⚡ Matriz de Risco (RBT - Risk-Based Testing)

| Componente | Nível de Risco | Impacto no Negócio | Taxa de Alteração | Prioridade de Teste | Cobertura Esperada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lambda Checkout** | **Alto** | Bloqueia vendas, perda de receita | Alta | **Crítica** | **100%** |
| **API Gateway** | Alto | Indisponibilidade do serviço | Média | Crítica | 95% |
| **DynamoDB Orders** | Alto | Perda/corrupção de dados | Média | Crítica | 100% |
| **Contrato API Gateway ↔ Lambda** | Alto | Falha na comunicação | Média | Crítica | 95% |
| **Contrato Lambda ↔ DynamoDB** | Alto | Falha na persistência | Média | Crítica | 95% |

**Justificativa Shift-Left**: Os componentes críticos devem ter cobertura máxima desde as fases iniciais (testes de contrato e unitários), evitando retrabalho em produção.

---

## 3. 📊 Plano de Cobertura por Nível

### 3.1 Foco Integração (Testes de Contrato)
- **API Gateway ↔ Lambda Checkout**:
  - Validar formato de requisição esperado (Content-Type, Headers obrigatórios)
  - Validar formato de resposta (status codes 200, 400, 500)
  - Testar timeout de resposta (máx 30s)
  - Testar payloads malformados e rejeiçõs de schema

- **Lambda Checkout ↔ DynamoDB Orders**:
  - Validar escrita de pedidos com atributos completos
  - Testar validação de chave primária (order_id, user_id)
  - Testar TTL de dados e limpeza de histórico
  - Simular falhas de conexão com retry automático

### 3.2 Foco E2E (Jornadas Críticas do Usuário)
- **Happy Path - Checkout com Sucesso**:
  1. Usuário envia requisição POST `/checkout` com carrinho válido
  2. Lambda processa e cria pedido em DynamoDB
  3. Resposta retorna order_id e status "COMPLETED"
  4. Usuário recebe confirmação com detalhes do pedido

- **Caminho de Erro - Itens Indisponíveis**:
  1. Usuário tenta fazer checkout com item fora de estoque
  2. Lambda valida disponibilidade e retorna erro 400
  3. Usuário recebe mensagem clara do motivo da falha

- **Caminho de Erro - Falha de Pagamento**:
  1. Usuário envia pagamento inválido
  2. Lambda processa rejeição da gateway de pagamento
  3. Pedido é marcado como "FAILED" no DynamoDB
  4. Usuário é notificado e pode tentar novamente

- **Caminho de Erro - Timeout/Indisponibilidade**:
  1. Lambda não responde em 30s
  2. API Gateway retorna erro 504 Gateway Timeout
  3. Cliente recebe feedback claro e pode fazer retry idempotente

---

## 4. 🏗️ Pirâmide de Cobertura (Shift-Left)

```
         ▲ E2E (Testes de Jornada do Usuário)
        ╱ │ ╲ ~15% - 20 casos críticos
       ╱  │  ╲ Playwright/Cypress + LocalStack
      ╱───┼───╲
     ╱         ╲ Testes de Integração (Contratos AWS)
    ╱  ~40-50%  ╲ ~12 casos - Pytest + LocalStack/Moto
   ╱─────────────╲
  ╱               ╲ Testes Unitários (Lógica de Negócio)
 ╱    ~30-40%      ╲ ~25 casos - Pytest
╱___________________╲
```

### 4.1 Testes Unitários (~30-40%)
**Foco**: Lógica de negócio isolada da Lambda
- Validação de regras de checkout (estoque, preço, cupom)
- Cálculo de impostos e frete
- Formatação de resposta e tratamento de exceções
- Geração de order_id único
- **Framework**: Pytest com fixtures
- **Execução**: ~100ms por teste (rápido para feedback)

### 4.2 Testes de Integração (~40-50%)
**Foco**: Comunicação entre componentes AWS (Contratos)
- Lambda ↔ DynamoDB: Put, Get, Query, Update com vários cenários
- API Gateway ↔ Lambda: Headers, status codes, rate limiting
- **Framework**: Pytest + LocalStack (simula AWS localmente)
- **Execução**: ~500ms a 2s por teste
- **Mocking**: Usar boto3 moto para simular serviços AWS

### 4.3 Testes E2E (~15-20%)
**Foco**: Jornada completa do usuário
- Checkout end-to-end: requisição HTTP até persistência em DB
- Validação de respostas e estado final
- **Framework**: Playwright para testes de API/HTTP
- **Execução**: ~2-5s por teste
- **Ambiente**: LocalStack ou dev stack

---

## 5. 🛠️ Definição Tecnológica

### Tecnologias Recomendadas

| Nível | Framework | Ferramenta Auxiliar | Rationale |
| :--- | :--- | :--- | :--- |
| **Unitário** | Pytest | pytest-mock, pytest-cov | Rápido, CI-friendly, cobertura nativa |
| **Integração** | Pytest + LocalStack | moto (AWS mocking) | Testa contratos sem AWS real, determinístico |
| **E2E** | Playwright | httpx, pytest-asyncio | Testa fluxo HTTP, suporta async, reports visuais |

### Estratégia de Mocking

1. **Lambda Checkout**:
   - Mock da chamada a DynamoDB usando `moto.dynamodb`
   - Mock de serviços externos (payment gateway, inventory)
   - Injetar dependências via factory pattern

2. **API Gateway**:
   - Simular via LocalStack ou mock HTTP
   - Testar headers, querystring, body parsing
   - Validar CORS e throttling

3. **DynamoDB**:
   - LocalStack para testes de integração
   - Usar `dynamodb_resource` do boto3
   - Criar tabelas de teste com TTL configurado

### Massa de Dados (Data Factory)

```python
# Exemplo de Data Factory para Checkout
@pytest.fixture
def sample_checkout_request():
    return {
        "user_id": "user_123",
        "items": [
            {"sku": "ITEM001", "quantity": 2, "price": 29.99}
        ],
        "coupon_code": "SUMMER20",
        "shipping_address": {
            "city": "São Paulo",
            "state": "SP",
            "zip": "01234-567"
        }
    }

@pytest.fixture
def sample_order_response():
    return {
        "order_id": "ORD_2024_001",
        "status": "COMPLETED",
        "total": 59.98,
        "created_at": "2024-05-01T10:30:00Z"
    }
```

### CI/CD Integration

- **Trigger**: Push para branches feature/* e main
- **Execução Paralela**:
  - Unitários: 10-15s (rápido feedback)
  - Integração: 30-45s (LocalStack + testes de contrato)
  - E2E: 60-90s (jornadas completas)
- **Gate de Qualidade**: Mínimo 90% cobertura, todos E2E críticos devem passar
- **Reports**: HTML coverage, screenshots de falhas E2E, logs de integração

---

## 6. ✅ Critérios de Aceite

### Cobertura de Código
- [ ] **Mínimo 90%** de cobertura em ramos críticos (Lambda Checkout)
- [ ] **Mínimo 85%** de cobertura em integração (DynamoDB)
- [ ] **Meta 95%** em produção após 3 meses

### Casos de Teste
- [ ] **25 testes unitários** detalhados com entrada/saída esperada
- [ ] **12 testes de integração** em `tests/integration/` com LocalStack
- [ ] **20 testes E2E** em `tests/e2e/` cobrindo jornadas críticas
- [ ] Documentação de cada teste em `test_*.py` com docstrings

### Tratamento de Erros
- [ ] **Timeout (30s)**: Retornar erro 504 elegantemente
- [ ] **Falha de DB**: Retry exponencial (1s, 2s, 4s) + fallback
- [ ] **Payload inválido**: Erro 400 com mensagem clara
- [ ] **Rate limiting**: Erro 429 ao exceder 1000 req/min
- [ ] **Auth inválida**: Erro 401 com hint de renovação de token

### Artefatos Obrigatórios
- [ ] `tests/unit/test_checkout_logic.py` - Testes unitários
- [ ] `tests/integration/test_checkout_integration.py` - Contratos + LocalStack
- [ ] `tests/e2e/test_checkout_e2e.py` - Jornadas completas
- [ ] `tests/conftest.py` - Fixtures compartilhadas e configuração
- [ ] `.github/workflows/test.yml` - CI com stages paralelos
- [ ] `README_TESTING.md` - Guia de execução local e CI

---

## 7. 📅 Roadmap de Implementação (Shift-Left)

### Fase 1: Testes Unitários + Contratos (Semana 1)
- Implementar testes unitários para lógica de checkout
- Definir contratos esperados entre Lambda e DynamoDB
- Setup de LocalStack e moto

### Fase 2: Testes de Integração (Semana 2)
- Testar Lambda ↔ DynamoDB com LocalStack
- Testar API Gateway ↔ Lambda
- Validar retry logic e error handling

### Fase 3: Testes E2E (Semana 3)
- Implementar jornadas críticas com Playwright
- Testar resiliência (timeout, falha de rede)
- Validar fluxo completo de checkout

### Fase 4: CI/CD + Métricas (Semana 4)
- Configurar pipeline automatizado
- Relatórios de cobertura e performance
- Alertas de qualidade

---

## 8. 🎓 Shift-Left: Por Que Essa Estratégia?

1. **Feedback Rápido**: Testes unitários (10-15s) encontram bugs antes da integração
2. **Economia**: Muitos bugs detectados em unitários custam 10x menos que em produção
3. **Confiança**: Contratos validados (integração) garantem que componentes AWS funcionam junto
4. **Rastreabilidade**: Cada teste documenta o comportamento esperado
5. **Cobertura**: Matriz de risco garante que peças críticas têm 100% de testes

---

## 9. 📝 Próximos Passos

1. **Revisar** este plano com time de desenvolvimento
2. **Criar** estrutura de diretórios em `tests/`
3. **Implementar** testes unitários como base
4. **Configurar** LocalStack para integração
5. **Validar** com equipe antes de Deploy

---

**Documento gerado**: 2024-05-01  
**Estratégia**: Risk-Based Testing (RBT) + Shift-Left  
**QA Strategist**: Especialista em Arquitetura AWS e Teste de Contrato
