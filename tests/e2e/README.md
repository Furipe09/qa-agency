# Guia de Automação E2E - Playwright + Allure

## 📋 Visão Geral

Este diretório contém testes end-to-end automatizados para o fluxo de checkout usando Playwright com integração Allure para relatórios visuais.

### Estrutura de Diretórios

```
tests/e2e/
├── pages/                  # Page Object Models (POM)
│   ├── BasePage.ts        # Classe base com métodos comuns
│   └── CheckoutPage.ts    # Encapsulamento do fluxo de checkout
├── factories/              # Data Factories
│   └── CheckoutDataFactory.ts  # Geração de dados de teste
├── mock/                   # Gerenciadores de Mock
│   └── MockManager.ts      # Interceptação e mock de APIs
├── specs/                  # Suites de teste
│   └── checkout.spec.ts    # Testes de checkout
├── fixtures.ts            # Fixtures reutilizáveis
└── README.md              # Este arquivo
```

## 🎯 Princípios de Design

### 1. Page Object Model (POM)
- **Propósito**: Encapsular interações com a UI
- **Benefício**: Testes ficam legíveis e fáceis de manter
- **Exemplo**:
  ```typescript
  // ❌ Sem POM (frágil)
  await page.click('button[data-testid="checkout-btn"]');
  
  // ✅ Com POM (robusto)
  await checkoutPage.completeCheckout(paymentDetails);
  ```

### 2. Esperas Dinâmicas (Sem Sleep/Hardcoded Waits)
- **Regra**: Nunca use `page.waitForTimeout()` para sincronização
- **Alternativa**: Use `waitForSelector()`, `waitForResponse()`, estados dinâmicos
- **Exemplo**:
  ```typescript
  // ✅ Correto - espera dinâmica
  await this.page.waitForSelector(selector, { timeout: 30000 });
  
  // ❌ Errado - hardcoded sleep
  await new Promise(r => setTimeout(r, 5000));
  ```

### 3. Data Factories
- **Propósito**: Gerar dados sem hardcoding
- **Benefício**: Testes são reutilizáveis e agnósticos a dados
- **Exemplo**:
  ```typescript
  const testData = CheckoutDataFactory.generateCheckoutRequest();
  // Cada execução gera dados frescos
  ```

### 4. Mock de APIs
- **Propósito**: Testar sem dependências externas
- **Ferramentas**: `page.route()` para interceptar e simular respostas
- **Cenários**: Sucesso, falha, timeout, erro de servidor

## 🚀 Como Executar

### Instalação de Dependências

```bash
npm install
```

### Executar Todos os Testes E2E

```bash
npm run test:e2e
```

### Executar Teste Específico

```bash
npm run test:e2e -- checkout.spec.ts
```

### Executar em Modo Debug

```bash
npm run test:e2e:debug
```

### Gerar Relatório Allure

```bash
# Executar testes e gerar dados Allure
npm run test:e2e

# Gerar e abrir relatório HTML
npm run allure:report
npm run allure:open
```

## 📊 Relatórios Allure

### Configuração
O arquivo `playwright.config.ts` já está configurado com:

```typescript
reporter: [
  ['html'],
  ['allure-playwright'],  // ← Allure reporter
]
```

### Visualizar Relatório

```bash
# Gerar e abrir (tudo de uma vez)
allure generate ./allure-results --clean -o ./allure-report && allure open ./allure-report
```

### O que é Rastreado
- ✅ Passes/Fails por teste
- 📸 Screenshots de falhas
- 🎬 Vídeos de execução (se configurado)
- 📝 Logs de consola
- 🌳 Hierarquia de suites
- ⏱️ Duração de cada teste

## 🧪 Casos de Teste Implementados

### Happy Path
- ✅ Checkout completo com pagamento válido
- ✅ Aplicar cupom de desconto
- ✅ Múltiplos itens no carrinho
- ✅ Diferentes métodos de pagamento

### Cenários de Erro
- ✅ Cartão de crédito declinado
- ✅ Cupom inválido rejeitado
- ✅ Timeout de rede tratado elegantemente
- ✅ Erro de servidor (500) e retry

### Performance & Resiliência
- ✅ Loading spinner durante checkout
- ✅ Nenhuma espera hardcoded
- ✅ Tempo de conclusão medido

## 📝 Criando Novos Testes

### Template Básico

```typescript
import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutDataFactory } from '../factories/CheckoutDataFactory';
import { MockManager } from '../mock/MockManager';

test.describe('Nova Suite', () => {
  let checkoutPage: CheckoutPage;
  let mockManager: MockManager;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    mockManager = new MockManager(page);
    
    // Setup mocks antes de navegar
    await mockManager.mockCompleteCheckoutFlow();
  });

  test('Descrição do teste', async ({ page }) => {
    // Arrange
    const testData = CheckoutDataFactory.generateCheckoutRequest();

    // Act
    await checkoutPage.navigateToCheckout();
    const result = await checkoutPage.completeCheckout(testData.paymentDetails);

    // Assert
    expect(result.orderId).toBeTruthy();
  });
});
```

### Padrão AAA (Arrange-Act-Assert)
1. **Arrange**: Preparar dados e mocks
2. **Act**: Executar ação (interação com UI)
3. **Assert**: Validar resultado

## 🔍 Debugging

### Abrir DevTools Interativo
```bash
npx playwright test --debug
```

### Gerar Trace (para debug posteriores)
```typescript
await page.context().tracing.start({ screenshots: true, snapshots: true });
// ... seu teste
await page.context().tracing.stop({ path: 'trace.zip' });
```

### Ver Logs
```bash
npm run test:e2e -- --reporter=list
```

## 📦 Dependências

### Playwright
- `@playwright/test`: Framework de testes
- `@types/node`: Tipos TypeScript

### Allure
- `allure-playwright`: Reporter integrado
- `allure-commandline`: CLI para gerar relatórios

## 🛠️ Customização

### Alterar Timeout Global
No `playwright.config.ts`:
```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 30000,
},
```

### Adicionar Novo Mock
No `MockManager.ts`:
```typescript
async mockCustomEndpoint(pattern: string) {
  await this.page.route(pattern, (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ /* seu response */ }),
    });
  });
}
```

### Estender CheckoutPage
```typescript
export class CheckoutPage extends BasePage {
  // Adicione novos métodos conforme necessário
  async novoMetodo() {
    // Sua implementação
  }
}
```

## ✅ Checklist de Qualidade

- [ ] Todos os testes passam localmente
- [ ] Cobertura > 90% de caminhos críticos
- [ ] Nenhum `sleep()` ou espera hardcoded
- [ ] Data Factories usadas para todos os dados
- [ ] Mocks configurados para falhas esperadas
- [ ] Relatório Allure gerado sem erros
- [ ] Testes rodam em CI/CD sem flakiness

## 🐛 Troubleshooting

### Teste falha intermitentemente (flaky)
- ❌ Culprit: `page.waitForTimeout()` ou espera fixa
- ✅ Solução: Use `waitForSelector()` ou `waitForResponse()`

### Erro de timeout (30s)
- ❌ Culprit: API real lenta ou não mockada
- ✅ Solução: Configure mock de API antes do teste

### Screenshots/Vídeos não aparecem em Allure
- ❌ Culprit: Configuração faltando no `playwright.config.ts`
- ✅ Solução: Verifique `screenshot: 'on-failure'` na config

## 📚 Referências

- [Playwright Documentation](https://playwright.dev)
- [Allure Report](https://docs.qameta.io/allure/)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)

---

**Última Atualização**: 2024-05-01  
**Mantido por**: SDET Automation Team
