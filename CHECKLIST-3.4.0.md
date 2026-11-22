# ✅ Checklist de lanzamiento — v3.4.0

Fecha de build: 2026-11-22 · Rama: actual (todo sin commitear)

## Estado de la build (YA VERIFICADO)

- [x] `npm run typecheck` — limpio (web + node)
- [x] `npm test` — 35/35
- [x] `npm run build` — OK
- [x] `npm run dist` — instalador generado y configuración NSIS correcta
- [x] `latest.yml` generado (auto-actualizador apunta a 3.4.0 con sha512)
- [x] Asar limpio: solo `out/**` + `package.json` (83.5 MB, antes 190 MB
      por un campo `build` duplicado en package.json que empaquetaba el
      repo entero — eliminado, `publish` ahora vive en electron-builder.yml)
- [x] Sin canales IPC duplicados ni huérfanos (barridas rondas 29 y 32)
- [x] Migración de caché verificada contra datos reales (ronda 36)

## Artefactos listos para publicar (en `dist/`)

| Archivo | Uso |
|---|---|
| `Tekken8ComboOverlay-Setup-3.4.0.exe` | Instalador (subir al release) |
| `Tekken8ComboOverlay-Setup-3.4.0.exe.blockmap` | Diffs de auto-actualización (subir) |
| `latest.yml` | Manifest del auto-updater (subir, **imprescindible**) |

## Pasos para publicar (en orden)

1. **Commitear el trabajo** (decisión del proyecto):
   ```bash
   git add -A
   git commit -m "release: v3.4.0 — temas, onboarding, rutina, respaldos, búsqueda global"
   git tag v3.4.0
   git push origin main --tags
   ```
2. **Crear el release en GitHub** (repo `ProyectoKodi/tekken8-combo-overlay`):
   - Tag `v3.4.0`, título "Tekken 8 Combo Overlay 3.4.0"
   - Subir los 3 artefactos de la tabla (exe + blockmap + latest.yml)
   - Notas de versión: copiar de la sección "Resumen" abajo
3. **Discord Rich Presence**: subir los assets de `discord-assets/personaje/`
   y `discord-assets/rango/` al portal de la app oficial
   (ID `1573748294792777819`) si aún no se hizo — sin esto los usuarios no
   ven retrato/emblema en Discord (el estado de texto funciona igual).
4. **Probar el instalador** en una máquina limpia (o máquina virtual):
   instalar, abrir, comprobar que arranca oculto hasta detectar Tekken
   (o visible si Tekken corre), Sync, práctica y el candado.

## Pruebas manuales recomendadas antes de anunciar

- [ ] Instalación limpia desde el .exe de 3.4.0
- [ ] Primera apertura: onboarding de 3 pasos (una sola vez)
- [ ] Sync de todos: sin duplicados en el grid; Roger Jr. 28; fallos listados
- [ ] Cambio de tema (4) + modo OLED + lista compacta + sonido ✔ aprendido
- [ ] Práctica: paso a paso con ←/→, temporizador ⏱, mini-tarjeta −/⤢
- [ ] Ctrl+F entre personajes; Mi rutina; compartir progreso (PNG)
- [ ] Ayuda sin cortes; restaurar respaldo desde Ayuda
- [ ] Candado 🔒 + zona segura; F8/F9/F3 reasignables desde Ayuda
- [ ] Auto-actualización: con 3.3.1 instalado, debe ofrecer 3.4.0
      (necesita el `latest.yml` publicado)

## Resumen para las notas de versión

**Novedades de 3.4.0**
- 4 temas completos (Dorado, Azul eléctrico, Rojo Tekken, Verde jade) + modo OLED
- Onboarding guiado de primer arranque
- "Mi rutina": favoritos de todos los personajes en una lista
- Paso a paso en la tira de práctica (←/→) + temporizador y racha de días
- Mini-tarjeta de práctica anclable y arrastrable
- Búsqueda global Ctrl+F entre todos los personajes sincronizados
- Tarjeta de progreso compartible (PNG con retratos)
- Respaldos automáticos semanales + restauración desde Ayuda
- Descubrimiento automático de personajes nuevos (DLC) en cada Sync
- 10 fondos de banner, toasts multiidioma completos, ajustes de comportamiento
- Rendimiento: caché sin HTML crudo, sincronización sin trabajo duplicado,
  re-renders mínimos en la interfaz
- ~30% menos de tamaño en el instalador

## Notas / pendientes conocidos

- "Yujiro Hanma" reporta 0 combos de la web: si la página no tiene combos
  parseables aparecerá en la lista de fallos del Sync (comportamiento correcto).
- Carpeta `dist/` conserva instaladores viejos (1.0.0, 3.3.1) — borrar a mano
  si se quiere, no afectan al release.
- `resources/` ya no existe; yt-dlp eliminado en rondas anteriores.
