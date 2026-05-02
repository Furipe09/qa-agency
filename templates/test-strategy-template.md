# 🎯 Estratégia de Teste: [Nome da Peça/Aplicação]

## 1. 🔍 Visão Geral da Arquitetura
- **Componentes AWS Identificados**: [Lista baseada no XML]
- **Fluxos de Integração**: [Caminhos de comunicação entre peças]

## 2. ⚡ Matriz de Risco (RBT)
| Componente | Nível de Risco | Impacto no Negócio | Prioridade de Teste |
| :--- | :--- | :--- | :--- |
| Ex: Lambda Auth | Alto | Bloqueia Acesso | Crítica |

## 3. Plano de Cobertura
- **Foco Integração**: [Contratos de API]
- **Foco E2E**: [Fluxos de usuário final]

## 4. 🏗️ Pirâmide de Cobertura
- **Unitários**: [Foco em lógica interna]
- **Integração**: [Foco em contratos entre serviços AWS]
- **E2E**: [Fluxos críticos do usuário final]

## 5. 🛠️ Definição Tecnológica
- **Framework**: [Playwright | Cypress | Pytest]
- **Estratégia de Mocking**: [Quais serviços AWS serão simulados]
- **Massa de Dados**: [Estratégia de Data Factories]

## 6. ✅ Critérios de Aceite
- Cobertura mínima de caminhos felizes.
- Casos de teste detalhados (passos/inputs/outputs) em arquivos separados.
- configure templates de CI para rodar as suites sugeridas.
- gerar arquivos de teste automatizados (pytest/LocalStack + exemplos de mocks)
- Cobertura de testes de 99%.
- os testes devem ser gerados na (tests).
- Tratamento de erros para falhas de rede/integração.