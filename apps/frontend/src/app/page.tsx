'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  JoinRoomPayload,
  RoomUpdatedPayload,
  RoomState,
} from '@party-games/shared';

let socket: Socket;

export default function Home() {
  const [roomCode, setRoomCode] = useState('ABCD');
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Guardamos el estado completo de la sala en lugar de solo mensajes de texto
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setRoom(null);
    });

    // Escuchamos el nuevo contrato y guardamos el objeto room
    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      console.log('Mensaje del servidor:', data.message);
      setRoom(data.room);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) return;

    const payload: JoinRoomPayload = {
      roomCode: roomCode.toUpperCase(),
      playerName: playerName.trim(),
    };

    socket.emit(SocketEvents.JOIN_ROOM, payload);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Lobby Test</h1>
          <span
            className={`h-3 w-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </div>

        {/* Si no estamos en una sala, mostramos el formulario */}
        {!room ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código de Sala</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-center font-mono uppercase text-lg"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!isConnected}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded font-semibold transition"
            >
              Unirse a la Sala
            </button>
          </div>
        ) : (
          /* Si ya estamos en una sala, mostramos el estado de la misma */
          <div className="space-y-4">
            <div className="text-center p-4 bg-slate-950 rounded border border-slate-700">
              <p className="text-sm text-slate-400">Estás en la sala</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-emerald-400 my-2">
                {room.roomCode}
              </p>
              <p className="text-sm text-slate-400">Modo: {room.mode}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-700">
              <h2 className="text-sm uppercase font-semibold text-slate-400 mb-3">
                Jugadores conectados ({room.players.length}):
              </h2>
              <ul className="space-y-2">
                {room.players.map((player) => (
                  <li key={player.id} className="flex items-center gap-2 text-sm bg-slate-800 p-2 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-medium">{player.name}</span>
                    {player.id === socket.id && (
                      <span className="text-xs text-slate-400 ml-auto">(Tú)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}