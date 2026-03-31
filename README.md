# GroupCOS Reportes Integrados

Aplicación unificada en Next.js para los módulos:

- `reportes-calidad`
- `reportes-calidad-reincidentes`

## Ejecución

```bash
npm install
npm run dev
```

## Fuentes integradas en SQL

Las bases de datos ya no se cargan desde archivos Excel en la interfaz. Ahora se consumen desde el apartado `db/`:

- `db/reportes-calidad/BASE_DE_DATOS_REPORT.sql`
- `db/reportes-calidad/BBDD_ANTIFRAUDE.sql`
- `db/reportes-calidad/BBDD_SPEECH_ANALYTICS.sql`
- `db/reportes-calidad-reincidentes/BASE_DE_DATOS_SOUL.sql`

Las rutas API internas leen estas fuentes y entregan la información procesada a cada módulo sin alterar la lógica de negocio existente.
