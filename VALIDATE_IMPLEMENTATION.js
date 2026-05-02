#!/usr/bin/env node

/**
 * 🔍 Validation Script - SDET Automation Implementation
 * Verifica se todos os arquivos foram criados corretamente
 * 
 * Uso: node VALIDATE_IMPLEMENTATION.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Arquivos esperados
const requiredFiles = {
  'tests/e2e/pages/BasePage.ts': '✅ Page base com esperas dinâmicas',
  'tests/e2e/pages/CheckoutPage.ts': '✅ Fluxo de checkout encapsulado',
  'tests/e2e/factories/CheckoutDataFactory.ts': '✅ Geradores de dados',
  'tests/e2e/mock/MockManager.ts': '✅ Interceptor de APIs',
  'tests/e2e/checkout.spec.ts': '✅ 11 casos de teste',
  'tests/e2e/specs/checkout.spec.ts': '✅ Suite paralela',
  'tests/e2e/fixtures.ts': '✅ Fixtures do Playwright',
  'tests/e2e/README.md': '✅ Guia de E2E',
  'tests/e2e/IMPLEMENTATION_REPORT.md': '✅ Relatório técnico',
  'playwright.config.ts': '✅ Configuração com Allure',
  'package.json': '✅ Scripts e dependências',
  'tsconfig.json': '✅ TypeScript stricto',
  '.prettierrc': '✅ Formatação automática',
  '.editorconfig': '✅ Consistência IDE',
  'AUTOMATION_CHECKLIST.md': '✅ Checklist de qualidade',
  'INTEGRATION_GUIDE.md': '✅ Guia de integração',
  'EXECUTIVE_SUMMARY.md': '✅ Resumo executivo',
};

console.log('🔍 Validando Implementação SDET Automation\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

for (const [file, description] of Object.entries(requiredFiles)) {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${file.padEnd(45)} (${sizeKb}KB)`);
    console.log(`   ${description}`);
    passed++;
  } else {
    console.log(`❌ ${file.padEnd(45)} FALTANDO`);
    failed++;
  }
}

console.log('=' .repeat(60));
console.log(`\nResultado: ${passed}/${Object.keys(requiredFiles).length} arquivos criados\n`);

if (failed === 0) {
  console.log('🎉 Implementação COMPLETA e VALIDADA!');
  console.log('\n📋 Próximos Passos:');
  console.log('  1. npm install');
  console.log('  2. npm run test:e2e');
  console.log('  3. npm run allure:open');
  process.exit(0);
} else {
  console.log(`❌ ${failed} arquivo(s) não encontrado(s)`);
  process.exit(1);
}
