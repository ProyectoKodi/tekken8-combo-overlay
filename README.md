# 🥋 Tekken 8 Combo Overlay Pro (Ver. 3.03.01)

Un overlay interactivo, ligero y seguro para Windows 11, diseñado para practicar combos de Tekken 8 mientras juegas. Extrae los combos directamente de la web de Kage y los muestra con la notación visual oficial, sin inyectar código en el juego (100% libre de baneos).

![Electron](https://img.shields.io/badge/Electron-36BCF7?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## ✨ Características Principales

*   **📚 Base de Datos de Combos:** Extrae automáticamente más de 2,000 combos desde [Kage Website](https://tekken8combo.kagewebsite.com/).
*   **🎨 Notación Visual:** Convierte texto (`d/f,2`) en los iconos oficiales del juego (flechas y botones de PlayStation).
*   **🖥️ Overlay Flotante:** Ventana transparente que se superpone al juego. Funciona en "Pantalla completa sin bordes".
*   **🖱️ Click-Through:** Botón de candado para que los clics del ratón pasen directamente al juego sin molestar.
*   **🔍 Filtros Avanzados:** Filtra por personaje, dificultad, daño mínimo (con botón rápido 100+), propiedades (Heat, Pared, Counter, Rage, etc.) y estado (Agachado, De pie).
*   **⭐ Favoritos y ✔️ Aprendidos:** Guarda tus combos favoritos y marca los que ya dominas. Todo se guarda **por personaje** (los favoritos de Kazuya son distintos a los de Jin).
*   **⏱️ Historial de Recientes:** Accede rápidamente a los últimos 10 combos que has practicado.
*   **✏️ Notas Personales:** Añade un cuadro de texto a cada combo con tus propios trucos o advertencias.
*   **👁️ Modo Streamer:** Vuelve el fondo del overlay 100% transparente para que tus espectadores solo vean los combos flotando sobre el juego.
*   **🏆 Modo Torneo:** Oculta todos los botones de edición para una experiencia limpia y profesional.
*   **🌍 Multiidioma:** Soporte nativo para Español, Inglés y Portugués.
*   **🎨 Temas de Color:** Cambia el color de acento de la interfaz (Dorado, Azul, Rojo, Verde, Rosa).
*   **📏 Modo Compacto:** Oculta la barra de búsqueda y filtros para dejar solo la lista de combos.
*   **🔄 Actualización Automática:** La app detecta nuevas versiones y se actualiza sola.
*   **📤 Exportar/Importar:** Haz copias de seguridad de tus perfiles completos (favoritos, notas y combos personalizados) para pasárselos a un amigo.

## 🚀 Instalación Rápida (Windows 11)

1.  Ve a la sección de **[Releases](https://github.com/proyectokodi-jpg/tekken8-combo-overlay/releases)** de este repositorio.
2.  Descarga el último archivo `Tekken8ComboOverlay-Setup-X.X.X.exe`.
3.  Ejecuta el instalador y sigue las instrucciones (no requiere permisos de administrador).
4.  Abre Tekken 8 y asegúrate de tenerlo en **"Pantalla completa sin bordes"** (Borderless Windowed) en las opciones gráficas.
5.  Abre el overlay desde el menú Inicio y ¡a practicar!

## 🎮 Controles del Overlay

| Acción | Tecla / Botón |
| :--- | :--- |
| Abrir / Cerrar Overlay | **F9** |
| Colapsar / Expandir | **F10** |
| Navegar por la lista | Ratón |
| Abrir Modo Práctica | Clic en cualquier combo |
| Bloquear Ratón | Botón 🔒/🔓 (Candado) |
| Modo Enfoque / Compacto | Botones 🎯 y 📏 |
| Cambiar de Idioma | Menú desplegable en la barra superior |

## 🛠️ Para Desarrolladores (Compilar desde cero)

Si quieres modificar el código o compilarlo tú mismo:

```bash
# 1. Clona el repositorio
git clone https://github.com/proyectokodi-jpg/tekken8-combo-overlay.git

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

⚠️ Aviso Legal
Este proyecto es una herramienta de terceros sin afiliación oficial con Bandai Namco. 
Tekken 8 es una marca registrada de sus respectivos dueños. La aplicación no inyecta código, 
no lee la memoria del juego ni automatiza inputs, por lo que es 100% segura frente a los sistemas anti-cheat.



MIT License

Copyright (c) 2026 proyectokodi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
