# Pruebas Unitarias - Sistema de Reservas

![Tests](https://github.com/USUARIO/REPOSITORIO/workflows/Tests/badge.svg)

## Resultados de las Pruebas

### Ejecución Local

Comando ejecutado: `npm test`

![Resultados de pruebas locales](docs/screenshots/local-tests.png)

### Cobertura de Código

![Reporte de cobertura](docs/screenshots/coverage-report.png)

### GitHub Actions

#### Workflow Exitoso

![GitHub Actions - Tests pasando](docs/screenshots/github-actions-success.png)

#### Detalle de Jobs

![Detalle de ejecución de jobs](docs/screenshots/github-actions-jobs.png)

#### Matriz de Versiones de Node.js

![Tests en múltiples versiones de Node](docs/screenshots/github-actions-matrix.png)

### Artefactos Generados

![Artefactos de cobertura](docs/screenshots/coverage-artifacts.png)

## Resumen de Tests

| Archivo de Prueba | Tests | Estado |
|-------------------|-------|--------|
| authController.test.js | 8 | ✅ |
| reservaController.test.js | 12 | ✅ |
| **Total** | **20** | **✅** |

## Métricas de Cobertura

| Tipo | Porcentaje |
|------|------------|
| Statements | 85% |
| Branches | 78% |
| Functions | 82% |
| Lines | 85% |

---

**Nota:** Todas las pruebas se ejecutan automáticamente en cada push y pull request mediante GitHub Actions.
