# 🚀 QA Agency Framework

## Visão Geral
Este framework organiza uma agência de QA baseada em agentes de IA especializados. A estrutura foi desenhada para que a inteligência artificial analise a arquitetura (via Draw.io) e o código-fonte (via Git) de forma coordenada.

## 🤖 Os Agentes
1. **QA Strategist**: Focado em Shift-Left, análise de risco AWS e definição da estratégia global.
2. **SDET Automation**: Focado em engenharia de software aplicada a testes e implementação de código limpo.

## 📂 Estrutura do Projeto
- `qa-strategist/`: Skill de planejamento e análise de risco.
- `sdet-automation/`: Skill de codificação e automação.
- `docs/`: Manuais e guias operacionais.
- `templates/`: Modelos de documentos de saída.

## ⚙️ Pré-requisitos
- **Draw.io**: Diagramas exportados obrigatoriamente em formato **XML**.
- **VS Code + Copilot**: Para orquestração dos agentes via Chat.
- **Node.js/Python**: Dependendo do framework de automação escolhido.

## 💻 Como rodar os testes no terminal do VS CodePara executar os testes gerados pelos seus agentes, siga estes passos diretamente no terminal integrado do VS Code (Ctrl + '):🔹 Para testes com Playwright (Node.js)
- Certifique-se de estar na raiz do projeto.

### 🔹Com Playwright (UI):

- Instale as dependências: npm install.
- Instale os navegadores: npx playwright install.
- Execute os testes:
 - npm install (instala o framework)
 - Todos os testes: npx playwright test
 - Um arquivo específico: npx playwright test tests/carrinho.spec.ts
 - vê o resultado visual: npx playwright show-report
 - Com interface visual: npx playwright test --headed

- ### 🔹 Para testes com Pytest (Python)
 - Crie um ambiente virtual: python -m venv venv.
 - Ative o ambiente: source venv/bin/activate (Linux/Mac) ou .\venv\Scripts\activate (Windows).
 - Instale as dependências: pip install -r requirements.txt.
 - Execute os testes:
   - pip install -r requirements.txt
   - pytest -v (roda os testes com detalhes no terminal)
   - Todos os testes: pytest
   - Com relatório detalhado: pytest -v
   - Apenas testes de uma pasta: pytest tests/api/

## 🟡 Guia de Uso: Exemplos de PromptsPara obter o melhor dos agentes, utilize os modelos de comando abaixo:
- Para o Strategist: "Analise o arquivo arquitetura.xml e gere a matriz RBT. Identifique quais lambdas de integração entre o Gateway e o DynamoDB oferecem maior risco de timeout."
- Para o SDET: "Com base na matriz RBT gerada, implemente o teste de 'Carrinho de Compras' usando Playwright. Use o Page Object Model e garanta que a API de estoque seja mockada."

## 🔵 Matriz de RastreabilidadeEsta matriz garante que nenhum agente ignore os documentos fundamentais durante a automação. Ela serve como um checklist de "quem lê o quê".

Origem (Input)	Processado por	Destino (Output)	Objetivo
<code>arquitetura.xml</code>	QA Strategist	<code>test-strategy-template.md</code>	Identificar fluxos e riscos.
<code>test-strategy-template.md</code>	SDET Automation	<code>/tests/</code> (Código)	Implementar scripts baseados no risco.
Código Git (Repositório)	SDET Automation	<code>/tests/pages/</code> (POM)	Mapear seletores e rotas reais.
<code>SKILL.md</code>	Ambos	Comportamento da IA	Garantir que os padrões (POM/RBT) sejam seguidos.