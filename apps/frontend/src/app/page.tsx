'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  JoinRoomPayload,
  RoomUpdatedPayload,
} from '@party-games/shared';

let socket: Socket;

export default function Home() {
  const [roomCode, setRoomCode] = useState('ABCD');
  const [playerName, setPlayerName] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectamos al backend en el puerto 4000
    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al servidor de sockets');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Escuchamos la respuesta usando el contrato compartido
    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) return;

    // Cumple estrictamente con JoinRoomPayload
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

        {messages.length > 0 && (
          <div className="mt-6 p-3 bg-slate-950 rounded border border-slate-800">
            <h2 className="text-xs uppercase font-semibold text-slate-400 mb-2">
              Actividad en la sala:
            </h2>
            <ul className="text-sm space-y-1">
              {messages.map((msg, index) => (
                <li key={index} className="text-emerald-400">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}