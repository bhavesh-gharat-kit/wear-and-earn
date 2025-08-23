"use client"

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const params = typeof window !== 'undefined' ? window.location.search : ''
    window.location.replace(`/login${params}`)
  }, [])
  return null
}