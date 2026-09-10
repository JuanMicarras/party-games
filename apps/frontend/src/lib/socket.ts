import { io, Socket } from 'socket.io-client';

// 'autoConnect: false' permite decidir exactamente en qué componente 
// (ej. la pantalla de Lobby) queremos abrir la conexión.
export const socket: Socket = io('http://localhost:4000', {
  autoConnect: false,
});