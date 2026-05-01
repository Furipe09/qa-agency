# 📖 Guia de Operação da Agência de QA

Este guia explica como orquestrar os agentes para cobrir uma aplicação inteira.

## 🛠️ Fluxo Operacional (XML → Strategist → SDET → Git)

1. **Input Visual:** Desenhe sua arquitetura no Draw.io e exporte como **XML**.
2. **Estratégia:** Peça ao `qa-strategist` no Copilot: 
   *"Analise este XML e crie o plano de testes seguindo o template oficial."*
3. **Automação:** Com o plano pronto, peça ao `sdet-automation-engineer`: 
   *"Baseado neste plano e no meu repositório Git, implemente os testes em [Framework]."*
4. **Versionamento:** Revise o código gerado e realize o `git push`.

## ✅ Regras de Ouro
- Use nomes técnicos claros no Draw.io.
- Defina o framework desejado (Playwright, Cypress ou Pytest) no início da automação.
- Peça sempre a criação de **Mocks** para serviços externos.