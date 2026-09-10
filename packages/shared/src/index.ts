export interface Player {
  id: string;
  name: string;
  team?: 'A' | 'B';
  isHost: boolean;
}

export type GameMode = 'LOBBY' | 'MIMIRETO' | 'POPSAUCE';

export interface RoomState {
  code: string;
  gameMode: GameMode;
  players: Player[];
}
