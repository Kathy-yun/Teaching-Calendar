import { create } from 'zustand'

interface WidgetState {
  isDragging: boolean
  dragOffset: { x: number; y: number }
  isResizing: boolean
  sidebarOpen: boolean

  setDragging: (dragging: boolean) => void
  setDragOffset: (offset: { x: number; y: number }) => void
  setResizing: (resizing: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useWidgetStore = create<WidgetState>((set) => ({
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  isResizing: false,
  sidebarOpen: false,

  setDragging: (isDragging) => set({ isDragging }),
  setDragOffset: (dragOffset) => set({ dragOffset }),
  setResizing: (isResizing) => set({ isResizing }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
