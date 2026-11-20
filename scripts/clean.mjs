// Borra el directorio de salida antes de compilar.
// Necesario porque el outDir del renderer está fuera de su `root` y Vite
// no lo vacía solo: sin esto quedan bundles y assets de builds anteriores.
import { rmSync } from 'node:fs'

rmSync('out', { recursive: true, force: true })
console.log('[clean] out/ eliminado')
