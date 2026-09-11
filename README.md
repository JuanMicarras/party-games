# Célula Party Games 🎮

Una plataforma de juegos multijugador en tiempo real diseñada para dinámicas grupales. Basada en el formato "Pantalla Compartida + Móvil" (estilo Jackbox Games), donde una pantalla central (TV) actúa como el tablero principal y los jugadores utilizan sus propios teléfonos celulares como controles.

## 🚀 Estado Actual: MVP Funcional (Modo Mimireto)

El proyecto cuenta con un sistema de salas robusto y el primer minijuego completamente jugable: **Mimireto** (un juego estilo Tabú).

### Características Principales:
* **Arquitectura Cliente-Servidor en Tiempo Real:** Comunicación de baja latencia mediante WebSockets (`Socket.io`).
* **Gestión de Salas (Lobby):** Generación de códigos únicos, roles de Host/Jugador y estado de red sincronizado.
* **Motor de Juego Mimireto:**
  * División automática y balanceada de equipos (A y B).
  * Asignación de roles dinámicos (Orador y Juez).
  * Temporizador autoritativo controlado estrictamente por el servidor (anti-trampas).
  * Cálculo matemático de turnos para asegurar que todos los integrantes participen.
* **Sistema de Resiliencia:** Si la pantalla de un jugador se bloquea, el servidor pausa el reloj automáticamente y permite la reconexión sin perder el progreso ni los roles.
* **Contenido Dinámico:** El mazo de cartas se inyecta mediante un archivo `cartas.json` en el servidor, permitiendo actualizar las palabras sin necesidad de recompilar el código.

## 🛠️ Stack Tecnológico (Monorepo)

* **Gestor de Paquetes:** `pnpm` con Workspaces.
* **Frontend (TV y Móviles):** Next.js (App Router), React 19, Tailwind CSS.
* **Backend (Lógica y WebSockets):** NestJS, TypeScript, Node.js (Módulos ESM).
* **Contratos (Shared):** Paquete intermedio para tipado estricto (Interfaces de estado, Payloads de eventos).

## 📂 Estructura del Proyecto

\`\`\`text
celula-party-games/
├── apps/
│   ├── frontend/         # UI en Next.js (Puerto 3000)
│   │   ├── src/app/host  # Vista de pantalla compartida (TV)
│   │   └── src/app/page  # Vista de control móvil (Jugadores)
│   │
│   └── backend/          # API y WebSockets en NestJS (Puerto 4000)
│       ├── src/room/     # Lógica de juego, Gateway y Servicios
│       └── cartas.json   # Base de datos local del mazo de Mimireto
│
├── packages/
│   └── shared/           # Tipos de TypeScript e interfaces compartidas
└── package.json
\`\`\`

## ⚙️ Cómo ejecutar en local

1. **Instalar dependencias:**
   Desde la raíz del proyecto, ejecuta:
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Levantar el entorno de desarrollo:**
   \`\`\`bash
   pnpm dev
   \`\`\`
   *(Esto iniciará simultáneamente el frontend, el backend y el compilador del paquete compartido).*

3. **Jugar:**
   * Abre `http://localhost:3000/host` en tu computadora (Pantalla Principal).
   * Abre `http://localhost:3000` en múltiples pestañas o dispositivos móviles para unirte como jugador.

---

## 🗺️ Próximos Pasos (Roadmap)

El núcleo del juego es estable. Los siguientes pasos para escalar la plataforma son:

* [ ] **1. Despliegue en la Nube (Producción):** Subir el Frontend a Vercel y el Backend a un servicio como Render o Railway para que cualquier persona pueda jugar desde su red de datos móviles mediante un enlace oficial.
* [ ] **2. Efectos de Sonido y Feedback (Inmersión):** Implementar archivos de audio para mejorar la experiencia en el TV (sonido de "Tic-Tac" en los últimos 10 segundos, chicharra de error al presionar "¡FALTA!" y campanada al adivinar una palabra).
* [ ] **3. Nuevo Minijuego (PopSauce):** Aprovechar la infraestructura de salas y sockets actual para desarrollar un segundo modo de juego basado en agilidad visual y respuestas rápidas de texto (Trivia/Imágenes).
*(Próximamente)* **Codenames**: Estrategia de palabras con roles de Spymasters y agentes de campo