# 🥋 Tekken 8 Combo Overlay Pro (Ver. 3.3.1)

Un overlay interactivo, ligero y seguro para Windows 11, diseñado para practicar combos de Tekken 8 mientras juegas. Extrae los combos directamente de la web de Kage y los muestra con la notación visual oficial, sin inyectar código en el juego (100% libre de baneos).

![Electron](https://img.shields.io/badge/Electron-36BCF7?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

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
