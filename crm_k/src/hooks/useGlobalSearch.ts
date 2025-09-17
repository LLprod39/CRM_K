'use client'

import { useState, useEffect } from 'react'

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+K для открытия глобального поиска
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        setIsOpen(true)
      }
      
      // Escape для закрытия
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return {
    isOpen,
    openSearch: () => setIsOpen(true),
    closeSearch: () => setIsOpen(false),
    toggleSearch: () => setIsOpen(!isOpen)
  }
}


