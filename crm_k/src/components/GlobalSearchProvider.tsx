'use client'

import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import GlobalSearch from '@/components/GlobalSearch'

export default function GlobalSearchProvider() {
  const { isOpen, closeSearch } = useGlobalSearch()

  return (
    <GlobalSearch 
      isOpen={isOpen} 
      onClose={closeSearch} 
    />
  )
}


