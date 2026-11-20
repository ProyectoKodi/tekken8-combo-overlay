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
2. Ejecuta el script de conversión (Pillow) o pide que se actualice.
3. Borra `out/` (`npm run clean`) y recompila: Vite no vacía el `outDir` del renderer.

## Notas

- Los emblemas ya incluyen el nombre del rango dibujado en el arte, así que no hace
  falta pintar el texto encima.
- `godofdestruction.png` es "God of Destruction"; `godofdestruction01..08` son los
  niveles I–VIII y `godofdestruction08` cierra con el símbolo ∞.
- Los retratos están a 160×192. A 1,5× de escalado DPI dan para unos 100×120 px de
  avatar nítido; para más tamaño haría falta arte de mayor resolución.
