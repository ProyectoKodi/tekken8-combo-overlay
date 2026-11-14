<<<<<<< HEAD
# Tekken 8 Combo Overlay

A transparent, always-on-top desktop overlay for Tekken 8 that fetches combos directly from [tekken8combo.kagewebsite.com](https://tekken8combo.kagewebsite.com/) and displays them using proper SVG button notation — so you can study combos while you play.
=======
# 🥋 Tekken 8 Combo Overlay Pro (Ver. 3.3.1)

Un overlay interactivo, ligero y seguro para Windows 11, diseñado para practicar combos de Tekken 8 mientras juegas. Extrae los combos directamente de la web de Kage y los muestra con la notación visual oficial, sin inyectar código en el juego (100% libre de baneos).
>>>>>>> 5a681d02bdca7da2749d3a36ce8bd66154b92f21

![Electron](https://img.shields.io/badge/Electron-36BCF7?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

<<<<<<< HEAD
## Features

- 🎮 **All 40 characters** — including Fahkumram, Miary-Zo and Jack-8
- 🖼️ **SVG notation rendering** — every input token shown as a proper button image (holds, just-frames, slides, delays, brackets, Heat Dash and more)
- ⭐ **Favorites** — star combos to pin them to the top; persists across sessions
- 🏋️ **Practice mode** — click any combo to open a step-by-step practice window
- 🏷️ **Tags & filters** — filter by Heat, Wall, Rage, CH, stage requirements and more
- 🔄 **Auto-cache** — combos are cached for 24 hours so the overlay loads instantly
- 📐 **Horizontal strip mode** — stretch to a thin bar across the top/bottom of your screen
- 🎨 **Transparent & click-through** — passes mouse clicks to the game when not in use

## Requirements

- [Node.js](https://nodejs.org/) **v18 or later**
- npm (comes with Node.js)

## How to run

```bash
# 1. Extract the ZIP (or clone the repo)

# 2. Open a terminal in the project folder and install dependencies
npm install

# 3. Start the overlay
npm run dev
```

The overlay window will appear. Press **F9** (default hotkey) to show/hide it while in-game.

## Building a standalone .exe

To build a Windows installer you can share without needing Node.js:

```bash
npm run dist
```

The installer will be in the `dist/` folder.

## Controls

| Action | How |
|--------|-----|
| Move overlay | Drag the title bar |
| Show / hide | `F9` hotkey |
| Collapse to bar | Click `—` button |
| Horizontal strip | Click `⇔` button |
| Practice a combo | Click any combo card |
| Star a combo | Click `☆` on the card |
| Refresh combos | Click `↻ Refresh` |

## Tech stack

- **Electron** + **electron-vite**
- **React 18** + **TypeScript**
- **TailwindCSS 3**
- **Zustand** (state management)
- **Cheerio** (HTML scraping in main process)
- **@tanstack/react-virtual** (virtualised combo list)
- **electron-store** (favorites + combo cache)
=======
## ✨ Características Principales

*   **📚 Base de Datos de Combos:** Extrae automáticamente más de 2,000 combos desde [Kage Website](https://tekken8combo.kagewebsite.com/).
*   **🎨 Notación Visual:** Convierte texto (`d/f,2`) en los iconos oficiales del juego.
*   **🖥️ Overlay Flotante:** Ventana transparente que se superpone al juego. Funciona en "Pantalla completa sin bordes".
*   **🖱️ Click-Through:** Botón de candado para que los clics del ratón pasen directamente al juego.
*   **🔍 Filtros Avanzados:** Filtra por personaje, dificultad, daño mínimo, propiedades (Heat, Pared, Counter) y estado.
*   **⭐ Favoritos y ✔️ Aprendidos:** Guarda tus combos favoritos y marca los que ya dominas. Todo se guarda **por personaje**.
*   **⏱️ Historial de Recientes:** Accede rápidamente a los últimos 10 combos practicados.
*   **✏️ Notas Personales:** Añade un cuadro de texto a cada combo con tus propios trucos.
*   **👁️ Modo Streamer:** Vuelve el fondo del overlay 100% transparente.
*   **🏆 Modo Torneo:** Oculta todos los botones de edición.
*   **🌍 Multiidioma:** Español, Inglés y Portugués.
*   **🎨 Temas de Color:** Dorado, Azul, Rojo, Verde, Rosa.
*   **📏 Modo Compacto:** Oculta la barra de búsqueda y filtros.
*   **🔄 Actualización Automática:** La app detecta nuevas versiones y se actualiza sola.
*   **📤 Exportar/Importar:** Haz copias de seguridad de tus perfiles completos.

## 🚀 Instalación Rápida (Windows 11)

1.  Ve a la sección de **[Releases](https://github.com/ProyectoKodi/tekken8-combo-overlay/releases)** de este repositorio.
2.  Descarga el último archivo `Tekken8ComboOverlay-Setup-X.X.X.exe`.
3.  Ejecuta el instalador y sigue las instrucciones (no requiere permisos de administrador).
4.  Abre Tekken 8 y asegúrate de tenerlo en **"Pantalla completa sin bordes"** (Borderless Windowed) en las opciones gráficas.
5.  Abre el overlay desde el menú Inicio y ¡a practicar!

## 🎮 Controles y Atajos de Teclado

Puedes usar el ratón para navegar por la interfaz, pero también tienes **atajos de teclado** para no soltar el mando:

| Tecla | Acción |
| :--- | :--- |
| **F9** | Mostrar / Ocultar el Overlay por completo. |
| **F10** | Colapsar / Expandir la ventana a su mínima expresión. |
| **F8** | **Bloquear / Desbloquear el ratón.** Si el candado está cerrado, los clics pasan al juego. Pulsa F8 para recuperar el ratón. |
| **F1** | Abrir rápidamente el formulario para **Añadir un Combo**. |
| **F3** | Alternar el **Modo Streamer** (fondo transparente). |

**Controles con el ratón (Haz clic en el icono ❓ dentro de la app para ver esta guía):**
*   **🔒/🔓 (Candado):** Bloquear/desbloquear clics.
*   **👁️ (Ojo):** Modo Streamer.
*   **🏆 (Trofeo):** Modo Torneo.
*   **📏 (Regla):** Modo Compacto.
*   **⭐ (Estrella):** Añadir a favoritos.
*   **○ / ✔:** Marcar como combo aprendido.
*   **📋:** Copiar la notación.
*   **💬:** Copiar el combo para Discord.
*   **✏️:** Añadir una nota personal.

## 🛠️ Para Desarrolladores (Compilar desde cero)

```bash
# 1. Clona el repositorio
git clone https://github.com/ProyectoKodi/tekken8-combo-overlay.git

# 2. Entra a la carpeta
cd tekken8-combo-overlay

# 3. Instala las dependencias
npm install

# 4. (Opcional) Descarga yt-dlp.exe y colócalo en la carpeta resources/
#    https://github.com/yt-dlp/yt-dlp/releases/latest

# 5. Ejecuta en modo desarrollo
npm run dev

# 6. Genera el instalador .exe
npm run dist
>>>>>>> 5a681d02bdca7da2749d3a36ce8bd66154b92f21
