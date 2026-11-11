import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ItemMetadata,
  ReferencePhoto,
  SearchSession,
} from '../types/search'

const emptyMetadata: ItemMetadata = {
  name: '',
  colour: '',
  brand: '',
  notes: '',
}

interface SearchContextValue {
  session: SearchSession
  setMetadata: (patch: Partial<ItemMetadata>) => void
  setReferences: (refs: ReferencePhoto[]) => void
  addReference: (ref: ReferencePhoto) => void
  updateReference: (id: string, patch: Partial<ReferencePhoto>) => void
  removeReference: (id: string) => void
  beginScan: () => void
  recordCandidates: (count: number, possibleMatches: number) => void
  confirmMatch: () => void
  rejectMatch: () => void
  endScan: () => void
  resetSession: () => void
  primaryReference: ReferencePhoto | null
}

const SearchContext = createContext<SearchContextValue | null>(null)

function initialSession(): SearchSession {
  return {
    references: [],
    metadata: { ...emptyMetadata },
    startedAt: null,
    endedAt: null,
    candidatesSeen: 0,
    possibleMatches: 0,
    confirmedMatch: false,
    rejectedCount: 0,
  }
}

const MAX_REFERENCES = 3

export function SearchProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SearchSession>(initialSession)

  const setMetadata = useCallback((patch: Partial<ItemMetadata>) => {
    setSession((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...patch },
    }))
  }, [])

  const setReferences = useCallback((refs: ReferencePhoto[]) => {
    setSession((prev) => ({
      ...prev,
      references: refs.slice(0, MAX_REFERENCES),
    }))
  }, [])

  const addReference = useCallback((ref: ReferencePhoto) => {
    setSession((prev) => {
      if (prev.references.length >= MAX_REFERENCES) return prev
      return { ...prev, references: [...prev.references, ref] }
    })
  }, [])

  const updateReference = useCallback((id: string, patch: Partial<ReferencePhoto>) => {
    setSession((prev) => ({
      ...prev,
      references: prev.references.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }, [])

  const removeReference = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      references: prev.references.filter((r) => r.id !== id),
    }))
  }, [])

  const beginScan = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      startedAt: Date.now(),
      endedAt: null,
      candidatesSeen: 0,
      possibleMatches: 0,
      confirmedMatch: false,
      rejectedCount: 0,
    }))
  }, [])

  const recordCandidates = useCallback((count: number, possibleMatches: number) => {
    setSession((prev) => ({
      ...prev,
      candidatesSeen: Math.max(prev.candidatesSeen, count),
      possibleMatches: Math.max(prev.possibleMatches, possibleMatches),
    }))
  }, [])

  const confirmMatch = useCallback(() => {
    setSession((prev) => ({ ...prev, confirmedMatch: true }))
  }, [])

  const rejectMatch = useCallback(() => {
    setSession((prev) => ({ ...prev, rejectedCount: prev.rejectedCount + 1 }))
  }, [])

  const endScan = useCallback(() => {
    setSession((prev) => ({ ...prev, endedAt: Date.now() }))
  }, [])

  const resetSession = useCallback(() => {
    setSession(initialSession())
  }, [])

  const primaryReference = session.references[0] ?? null

  const value = useMemo(
    () => ({
      session,
      setMetadata,
      setReferences,
      addReference,
      updateReference,
      removeReference,
      beginScan,
      recordCandidates,
      confirmMatch,
      rejectMatch,
      endScan,
      resetSession,
      primaryReference,
    }),
    [
      session,
      setMetadata,
      setReferences,
      addReference,
      updateReference,
      removeReference,
      beginScan,
      recordCandidates,
      confirmMatch,
      rejectMatch,
      endScan,
      resetSession,
      primaryReference,
    ],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}

export { MAX_REFERENCES }
