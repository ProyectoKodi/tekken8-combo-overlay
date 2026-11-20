# 🥋 Tekken 8 Combo Overlay

Overlay de escritorio para **Tekken 8** (Windows) que muestra combos sobre el juego y los renderiza con la notación visual oficial (iconos SVG de dirección y botones).

![Electron](https://img.shields.io/badge/Electron-36BCF7?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## ✨ Características

- **📚 Base de combos:** extrae los combos de [tekken8combo.kagewebsite.com](https://tekken8combo.kagewebsite.com/) con caché de 24 h.
- **🖼️ Ficha de jugador:** banner con fondo de escenario (elegible o automático), retrato de tu main, emblema del rango, región y prowess. Tiene variante compacta para el modo horizontal.
- **🎨 Notación visual:** convierte texto (`d/f,2 ► b,1,4`) en los iconos oficiales, incluidos holds, just-frames, slides, delays y Heat Dash.
- **🖥️ Overlay flotante:** ventana transparente, sin marco y *always-on-top*, pensada para "pantalla completa sin bordes".
- **🖱️ Click-through:** el botón de candado (o **F8**) deja pasar los clics al juego.
- **🔍 Filtros:** por personaje, dificultad, daño mínimo, propiedades (Heat, Pared, Rage, Counter…) y estado.
- **⭐ Favoritos y ✔ Aprendidos:** se guardan por combo y persisten entre sesiones.
- **⏱️ Recientes:** los últimos 10 combos practicados.
- **✏️ Notas personales:** una nota de texto por combo.
- **👁️ Modo Streamer** (fondo transparente) y **🏆 Modo Torneo** (oculta botones de edición).
- **📏 Modo Compacto** y **modo horizontal** (barra fina sobre el juego).
- **🌍 Multiidioma:** español, inglés y portugués.
- **🎨 Temas:** dorado, azul, rojo, verde y rosa.
- **🔄 Actualización automática** vía electron-updater (releases de GitHub).
- **📤 Exportar/Importar** perfil y combos personalizados.

## 🚀 Instalación

1. Descarga el instalador `Tekken8ComboOverlay-Setup-X.X.X.exe` de la sección [Releases](https://github.com/ProyectoKodi/tekken8-combo-overlay/releases).
2. Ejecútalo (no requiere permisos de administrador).
3. En Tekken 8, activa **"Pantalla completa sin bordes"** en las opciones gráficas.
4. Abre el overlay y pulsa **F9** para mostrarlo.

> ⚠️ **La ventana arranca oculta a propósito.** Se muestra sola cuando detecta `TekkenGame-Win64-Shipping.exe` en ejecución; si abres la app sin el juego, parece que no ha pasado nada. Pulsa **F9** para forzarla.

## 🎮 Controles

| Tecla | Acción |
| :--- | :--- |
| **F9** | Mostrar / ocultar el overlay |
| **F10** | Colapsar / expandir la ventana |
| **F8** | Bloquear / desbloquear el ratón (click-through) |
| **F1** | Abrir el formulario de "Añadir combo" |
| **F3** | Alternar Modo Streamer |

En la interfaz: 🔒 candado, 👁️ streamer, 🏆 torneo, 📏 compacto, ⟺ horizontal, ⭐ favorito, ○/✔ aprendido, 📋 copiar notación, 💬 copiar para Discord, ✏️ nota.

## 🛠️ Desarrollo

Requisitos: **Node.js 22.6+** (las pruebas usan el type-stripping nativo de Node) y npm.

```bash
npm install        # dependencias
npm run dev        # Electron + Vite en modo desarrollo
npm run typecheck  # TypeScript en los dos proyectos (renderer y node)
npm test           # pruebas de la lógica pura (node:test)
npm run assets     # regenera los WebP del banner desde assets-src/
npm run build      # compila main, preload y renderer en out/
npm run dist       # compila y genera el instalador NSIS en dist/
```

> En `npm run dev` la ventana se muestra al instante (en la versión instalada permanece oculta hasta detectar Tekken 8). DevTools ya no se abren solos: si los necesitas, `OPEN_DEVTOOLS=1 npm run dev` o, en PowerShell, `$env:OPEN_DEVTOOLS='1'; npm run dev`.

### Estructura

```
src/
├── main/        # proceso principal: ventana, IPC, scraping, caché, hotkeys
├── preload/     # puente contextBridge -> window.electronAPI
├── renderer/    # React + Zustand + Tailwind
│   ├── components/
│   ├── store/   # estado global (overlayStore)
│   ├── utils/   # notationParser (texto -> iconos)
│   └── locales/ # es / en / pt
└── shared/      # código compartido (comboHash)
tests/           # pruebas con node:test
```

### Stack

Electron 31 · electron-vite · React 18 · TypeScript 5 · TailwindCSS 3 · Zustand · Cheerio (scraping) · @tanstack/react-virtual · electron-store · electron-updater.

### Notas

- `resources/yt-dlp.exe` se empaqueta como recurso extra para futuras descargas de vídeo; hoy no se usa en el código.
- El perfil de rango (RankTracker) es de edición manual; los scrapers de Wavu Wank / EWGF.gg están disponibles pero dependen de servicios de terceros.
