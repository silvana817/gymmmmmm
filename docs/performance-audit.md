# Performance audit rapido (web GymPro)

Fecha: 2026-03-14

## Hallazgos tecnicos
- La app usa `React.lazy` + `Suspense` para cargar paginas por demanda (code-splitting), lo cual reduce la descarga inicial.
- Las imagenes de ejercicios no viven en el repo: se sirven desde un CDN configurable (`VITE_EXERCISE_MEDIA_BASE_URL`, por defecto jsDelivr).
- En las vistas de rutinas, los `<img>` se cargan con `loading="lazy"`, `decoding="async"` y `fetchpriority="low"` en la mayoria de thumbnails.
- En `MiRutina`, el frame alternativo de animacion solo se pide cuando hay `autoPlay` o `hover`, y se cachea la disponibilidad para no repetir probes.

## Tamaño de build (produccion)
Comando: `npm run build`

Principales chunks reportados por Vite (gzip):
- `index` JS: **78.03 kB**
- `index` CSS: **5.93 kB**
- `MiNutricion`: **54.91 kB**
- `generateCategoricalChart` (Recharts): **104.15 kB**
- `Progresion`: **9.65 kB**
- `MiRutina`: **5.42 kB**
- `Rutinas`: **6.27 kB**

## Lectura de optimizacion actual
### Lo que esta bien
1. **Code-splitting real por rutas** (evita bajar todo al inicio).
2. **Lazy loading de imagenes** en miniaturas.
3. **CDN para media** de ejercicios.
4. **Carga condicional de frame alternativo** (animacion) en vez de descargar todo siempre.

### Oportunidades de mejora (sin romper la app)
1. Migrar media de ejercicios a **WebP/AVIF** (si el origen lo permite) para bajar 25-50% de bytes.
2. Agregar `srcset/sizes` en thumbnails para no bajar imagenes mas grandes que el tamaño real.
3. Confirmar cache headers del CDN (`cache-control: public, max-age` alto + `immutable`).
4. Seguir separando modulos pesados de charts si no todos los usuarios entran a esas vistas.

## Estimacion de consumo para 200 usuarios
> Importante: es **estimacion**, no facturacion exacta. La factura real depende de CDN/proveedor, cache hit ratio, region y plan.

### Supuestos usados (conservadores)
- 200 usuarios.
- 1 sesion por usuario en el periodo que se compara.
- Peso de imagen promedio estimado: **~50 kB** por thumbnail JPG.

### Escenarios por sesion
1. **Solo carga inicial** (HTML + CSS + JS base):
   - ~0.09 MB por usuario
   - ~18 MB para 200 usuarios

2. **Sesion sin muchas imagenes** (base + paginas comunes JS):
   - ~0.26 MB por usuario
   - ~52 MB para 200 usuarios

3. **Sesion tipica con imagenes** (~30 thumbnails por usuario):
   - ~1.76 MB por usuario
   - ~352 MB para 200 usuarios

4. **Sesion intensa** (~80 thumbnails + frames extra):
   - ~6.26 MB por usuario
   - ~1.25 GB para 200 usuarios

## Cuanto gastaria “en plata” para 200 usuarios
La formula es: `Costo = GB_transferidos * precio_por_GB`.

### Si tomamos USD **0.08/GB** como referencia de calculo
- **Base (18 MB = 0.018 GB):** ~**USD 0.0014**
- **Light (52 MB = 0.052 GB):** ~**USD 0.0041**
- **Tipica (352 MB = 0.352 GB):** ~**USD 0.0282**
- **Intensa (1.25 GB):** ~**USD 0.1000**

### Rango rapido segun precio del proveedor
Para el escenario tipico (0.352 GB / 200 usuarios):
- a USD 0.02/GB => **USD 0.0070**
- a USD 0.05/GB => **USD 0.0176**
- a USD 0.08/GB => **USD 0.0282**
- a USD 0.12/GB => **USD 0.0422**

> Traduccion honesta: para solo 200 usuarios, el costo de ancho de banda de frontend suele ser **bajo**. El costo fuerte normalmente viene mas por plataforma fija (hosting/plan), base de datos y funciones serverless que por transferencia pura.

## Calculo reproducible (sin humo)
Se agrego un script para recalcular costos segun tus supuestos:

```bash
npm run estimate:bandwidth
npm run estimate:bandwidth -- --users 200 --sessions-per-user-day 3 --price-per-gb 0.08 --month-days 30
```

## Veredicto corto
- **La web esta razonablemente optimizada en JS inicial** (buen splitting por rutas).
- **El mayor costo de red viene de imagenes remotas**, no del bundle JS/CSS.
- Para 200 usuarios, el costo de ancho de banda puro es bajo; para numero exacto de factura hay que usar precio real de tu proveedor + logs reales.
