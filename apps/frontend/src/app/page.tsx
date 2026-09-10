'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('room_updated', (data) => {
      console.log('Actualización de sala:', data);
    });

    return () => {
      socket.disconnect();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_updated');
    };
  }, []);

  const handleJoin = () => {
    socket.emit('join_room', { roomCode: 'ABCD', playerName: 'Juan' });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Party Games</h1>
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <p>{isConnected ? 'Conectado al servidor' : 'Desconectado'}</p>
      </div>
      <button 
        onClick={handleJoin}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Unirse a sala ABCD
      </button>
    </main>
  );
}