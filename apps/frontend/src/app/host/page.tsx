'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents, RoomUpdatedPayload, RoomState } from '@party-games/shared';

let socket: Socket;

export default function HostPage() {
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      // Apenas se conecta el TV, pide crear una sala nueva
      socket.emit(SocketEvents.CREATE_ROOM);
    });

    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      setRoom(data.room);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-2xl animate-pulse">Creando sala...</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <div className="text-center space-y-8">
        <h1 className="text-3xl font-bold text-slate-400">Únete en tu celular</h1>
        
        <div className="bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 shadow-2xl">
          <p className="text-xl mb-4 text-slate-300">Ingresa el código:</p>
          <p className="text-8xl font-mono font-black tracking-widest text-emerald-400">
            {room.roomCode}
          </p>
        </div>

        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 min-w-[400px]">
          <h2 className="text-lg uppercase font-semibold text-slate-500 mb-4">
            Jugadores en el Lobby ({room.players.length})
          </h2>
          {room.players.length === 0 ? (
            <p className="text-slate-600 italic">Esperando jugadores...</p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {room.players.map((player) => (
                <span 
                  key={player.id} 
                  className="px-4 py-2 bg-blue-600 rounded-full font-semibold shadow-lg text-lg"
                >
                  {player.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botón que programaremos luego para arrancar Mimireto */}
        {room.players.length >= 2 && (
          <button className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-2xl transition transform hover:scale-105">
            ¡Empezar Juego!
          </button>
        )}
      </div>
    </main>
  );
}