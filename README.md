# GroupCOS Reportes Integrados

Aplicación en Next.js para el módulo:

- `correlaciones`

## Ejecución

```bash
npm install
npm run dev
```

## Fuentes integradas en SQL

Las bases de datos se consumen desde el apartado `db/`:

- `db/correlaciones/bd_auditorias_etb_retencion.sql`
- `db/correlaciones/bd_celula_antifraude.sql`
- `db/correlaciones/bd_efectividad.sql`
- `db/correlaciones/bd_nps_fcr.sql`
- `db/correlaciones/bd_voz_cliente.sql`

La ruta API interna de `correlaciones` lee estas fuentes y entrega la información procesada al módulo.
