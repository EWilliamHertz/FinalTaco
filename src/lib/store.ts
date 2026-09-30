import { create } from 'zustand';

export type GameSelection = 'pokemon' | 'mtg' | 'both' | null;

interface GameState {
  activeGame: GameSelection;
  setActiveGame: (game: GameSelection) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isSearchOpen: boolean;
  searchMode: "all" | "cards";
  setSearchOpen: (isOpen: boolean, mode?: "all" | "cards") => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeGame: null,
  setActiveGame: (game) => set({ activeGame: game }),
  isSidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  isSearchOpen: false,
  searchMode: "all",
  setSearchOpen: (isOpen, mode = "all") => set({ isSearchOpen: isOpen, searchMode: mode }),
}));
