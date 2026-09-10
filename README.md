# Party Games Platform 🎮

Plataforma interactiva de juegos multijugador en tiempo real para reuniones y grupos. Diseñada con una arquitectura de pantalla central compartida (Host TV/Web) y mandos móviles individuales sincronizados vía WebSockets.

---

## 🕹️ Juegos Incluidos

- **Mimireto**: Juego estilo Tabú por equipos. Un orador describe palabras prohibidas mientras un juez del equipo contrario valida las faltas desde su dispositivo.
- **PopSauce**: Trivia y reconocimiento visual competitivo en tiempo real con tolerancia a errores tipográficos (*fuzzy matching*).
- *(Próximamente)* **Codenames**: Estrategia de palabras con roles de Spymasters y agentes de campo.

---

## 🏗️ Arquitectura del Monorepo

El proyecto está organizado como un monorepo administrado con **pnpm Workspaces** y **Turborepo**:

```text
party-games/
├── apps/
│   ├── frontend/        # Next.js, React, Tailwind CSS (Vistas /host y /jugar)
│   └── backend/         # NestJS, Socket.io (Módulos de salas y lógica de minijuegos)
├── packages/
│   └── shared/          # Contratos TypeScript, modelos e interfaces de eventos WebSocket
├── package.json
└── turbo.json
