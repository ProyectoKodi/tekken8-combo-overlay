# Material original (NO se empaqueta)

Aquí viven los PNG originales del arte del banner: fondos de escenario, emblemas de rango
y retratos de personaje. **Nada de esta carpeta se copia al build ni al instalador.**

El material que se usa de verdad está en `src/renderer/assets/banner/`, ya optimizado a WebP:

| Carpeta | Original (PNG) | Optimizado (WebP) | Uso en la app |
|---|---|---|---|
| `fondo/` | 19 fondos 1920×1080 | 3 fondos 1400×788, ~50–120 KB | Fondo del banner del jugador |
| `rango/` | 39 emblemas 500×250 | 39 emblemas 320×160, ~25 KB | Insignia del rango |
| `Personaje/` | 43 retratos 160×192 | 43 retratos 160×192, ~12 KB | Avatar del jugador |

Peso total: **70,8 MB → 1,69 MB**.

## Cómo regenerar los optimizados

1. Cambia o añade material en esta carpeta.
2. `npm run assets` — convierte lo que haya cambiado (incremental por fecha).
   - `npm run assets -- --force` reescribe todo.
   - `npm run assets -- --all` incluye los 19 fondos (por defecto solo 3 curados).
3. `npm run build` para recompilar.

Los fondos que entran por defecto se eligen en `scripts/optimize-assets.mjs`
(constante `CURATED_BACKGROUNDS`).

## Notas

- Los emblemas ya incluyen el nombre del rango dibujado en el arte, así que no hace
  falta pintar el texto encima.
- `godofdestruction.png` es "God of Destruction"; `godofdestruction01..08` son los
  niveles I–VIII y `godofdestruction08` cierra con el símbolo ∞.
- Los retratos están a 160×192. A 1,5× de escalado DPI dan para unos 100×120 px de
  avatar nítido; para más tamaño haría falta arte de mayor resolución.
