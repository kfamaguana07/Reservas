const ZapClient = require('zaproxy');
const fs = require('fs');
const path = require('path');

const zapOptions = {
  apiKey: process.env.ZAP_API_KEY || 'changeme',
  proxy: 'http://localhost:8080',
};

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
const zapClient = new ZapClient(zapOptions);

async function runOWASPScan() {
  console.log('🔒 Iniciando análisis de seguridad OWASP ZAP...\n');

  try {
    // 1. Spider: Exploración de la aplicación
    console.log('🕷️  Fase 1: Spider Scan (Exploración)...');
    const spiderScanId = await zapClient.spider.scan(targetUrl);
    await waitForScanCompletion(zapClient.spider, spiderScanId);
    console.log('✅ Spider completado\n');

    // 2. Escaneo pasivo
    console.log('👀 Fase 2: Passive Scan...');
    await sleep(5000); // Esperar que el escaneo pasivo termine
    console.log('✅ Passive Scan completado\n');

    // 3. Escaneo activo (OWASP Top 10)
    console.log('⚔️  Fase 3: Active Scan (OWASP Top 10)...');
    const activeScanId = await zapClient.ascan.scan(targetUrl, {
      recurse: true,
      inScopeOnly: false,
    });
    await waitForScanCompletion(zapClient.ascan, activeScanId);
    console.log('✅ Active Scan completado\n');

    // 4. Obtener alertas de seguridad
    console.log('📊 Generando reporte de vulnerabilidades...\n');
    const alerts = await zapClient.core.alerts(targetUrl);
    
    // Clasificar por severidad
    const vulnerabilities = {
      high: alerts.filter(a => a.risk === 'High'),
      medium: alerts.filter(a => a.risk === 'Medium'),
      low: alerts.filter(a => a.risk === 'Low'),
      informational: alerts.filter(a => a.risk === 'Informational'),
    };

    // Mostrar resumen
    console.log('═══════════════════════════════════════════');
    console.log('🔍 RESUMEN DE VULNERABILIDADES ENCONTRADAS');
    console.log('═══════════════════════════════════════════');
    console.log(`🔴 Alta:          ${vulnerabilities.high.length}`);
    console.log(`🟠 Media:         ${vulnerabilities.medium.length}`);
    console.log(`🟡 Baja:          ${vulnerabilities.low.length}`);
    console.log(`ℹ️  Informativa:  ${vulnerabilities.informational.length}`);
    console.log('═══════════════════════════════════════════\n');

    // Mostrar detalles de vulnerabilidades críticas
    if (vulnerabilities.high.length > 0) {
      console.log('🔴 VULNERABILIDADES DE ALTA SEVERIDAD:');
      console.log('═══════════════════════════════════════════');
      vulnerabilities.high.forEach((alert, index) => {
        console.log(`\n${index + 1}. ${alert.alert}`);
        console.log(`   Riesgo: ${alert.risk}`);
        console.log(`   Confianza: ${alert.confidence}`);
        console.log(`   URL: ${alert.url}`);
        console.log(`   Descripción: ${alert.description.substring(0, 200)}...`);
      });
    }

    // Generar reportes
    const reportsDir = path.join(__dirname, '../../reports/security');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Reporte HTML
    const htmlReport = await zapClient.core.htmlreport();
    fs.writeFileSync(
      path.join(reportsDir, 'owasp-zap-report.html'),
      htmlReport
    );
    console.log(`\n✅ Reporte HTML generado: reports/security/owasp-zap-report.html`);

    // Reporte JSON
    fs.writeFileSync(
      path.join(reportsDir, 'owasp-zap-report.json'),
      JSON.stringify({ vulnerabilities, alerts }, null, 2)
    );
    console.log(`✅ Reporte JSON generado: reports/security/owasp-zap-report.json`);

    // Reporte Markdown para el informe
    generateMarkdownReport(vulnerabilities, reportsDir);

    console.log('\n🎉 Análisis de seguridad completado exitosamente!');
    
    // Retornar código de salida según vulnerabilidades
    if (vulnerabilities.high.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Se encontraron vulnerabilidades de alta severidad');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. OWASP ZAP esté corriendo en http://localhost:8080');
    console.error('   2. Tu aplicación esté corriendo en http://localhost:3000');
    console.error('   3. La API Key sea correcta');
    process.exit(1);
  }
}

async function waitForScanCompletion(scanner, scanId) {
  let progress = 0;
  while (progress < 100) {
    await sleep(2000);
    progress = await scanner.status(scanId);
    process.stdout.write(`\r   Progreso: ${progress}%`);
  }
  console.log('\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateMarkdownReport(vulnerabilities, reportsDir) {
  const markdown = `# 🔒 Reporte de Seguridad OWASP ZAP

**Fecha del análisis:** ${new Date().toLocaleString('es-ES')}
**URL analizada:** ${targetUrl}

## Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Alta | ${vulnerabilities.high.length} |
| 🟠 Media | ${vulnerabilities.medium.length} |
| 🟡 Baja | ${vulnerabilities.low.length} |
| ℹ️ Informativa | ${vulnerabilities.informational.length} |

## Vulnerabilidades de Alta Severidad

${vulnerabilities.high.length > 0 ? vulnerabilities.high.map((v, i) => `
### ${i + 1}. ${v.alert}

- **Riesgo:** ${v.risk}
- **Confianza:** ${v.confidence}
- **URL:** ${v.url}
- **CWE ID:** ${v.cweid || 'N/A'}
- **WASC ID:** ${v.wascid || 'N/A'}

**Descripción:**
${v.description}

**Solución:**
${v.solution}

**Referencias:**
${v.reference}

---
`).join('\n') : '_No se encontraron vulnerabilidades de alta severidad._'}

## Vulnerabilidades de Media Severidad

${vulnerabilities.medium.length > 0 ? vulnerabilities.medium.map((v, i) => `
### ${i + 1}. ${v.alert}

- **Riesgo:** ${v.risk}
- **Confianza:** ${v.confidence}
- **URL:** ${v.url}

**Descripción:**
${v.description.substring(0, 300)}...

---
`).join('\n') : '_No se encontraron vulnerabilidades de media severidad._'}

## Recomendaciones

1. Corregir inmediatamente las vulnerabilidades de alta severidad
2. Planificar corrección de vulnerabilidades de media severidad
3. Revisar y documentar vulnerabilidades informativas
4. Realizar análisis de seguridad periódicos
5. Implementar pruebas de seguridad en CI/CD

---
*Reporte generado automáticamente por OWASP ZAP*
`;

  fs.writeFileSync(
    path.join(reportsDir, 'SECURITY-REPORT.md'),
    markdown
  );
  console.log(`✅ Reporte Markdown generado: reports/security/SECURITY-REPORT.md`);
}

// Ejecutar el análisis
runOWASPScan();
