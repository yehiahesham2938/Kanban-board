import { useState, useCallback } from 'react'
import { mergeLists, mergeCards } from '../utils/merge'
import { baseVersionStorage } from '../services/baseVersionStorage'
import { storage } from '../services/storage'
import { api } from '../services/api'

export function useSyncWithConflictResolution(onConflict) {
  const [conflicts, setConflicts] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)

  const syncWithServer = useCallback(
    async (localState) => {
      setIsSyncing(true)
      try {
        const baseVersion = baseVersionStorage.load()
        const localData = localState || storage.load()

        if (!localData || !localData.lists) {
          setIsSyncing(false)
          return { conflicts: [], merged: null }
        }

        // Fetch server state from API
        let serverData
        try {
          serverData = await api.getBoardState()
        } catch (error) {
          // If fetch fails, use base version as server state
          console.warn('Failed to fetch server state, using base version:', error)
          serverData = baseVersion || { lists: [] }
        }

        if (!serverData || !serverData.lists) {
          serverData = { lists: [] }
        }

        // Safeguard: If local has data but server is empty and no base version exists,
        // don't sync - preserve local data (this handles seeded data on first load)
        if (!baseVersion && localData.lists && localData.lists.length > 0 && 
            (!serverData.lists || serverData.lists.length === 0)) {
          // Initialize base version with local data to prevent future overwrites
          baseVersionStorage.save(localData)
          setIsSyncing(false)
          return { conflicts: [], merged: localData }
        }

        // Perform three-way merge
        const baseLists = baseVersion?.lists || []
        const localLists = localData.lists || []
        const serverLists = serverData.lists || []

        const listMergeResult = mergeLists(baseLists, localLists, serverLists)

        // Merge cards within each list
        const finalLists = []
        const allConflicts = [...listMergeResult.conflicts]

        for (const list of listMergeResult.merged) {
          const baseList = baseLists.find((l) => l.id === list.id)
          const localList = localLists.find((l) => l.id === list.id)
          const serverList = serverLists.find((l) => l.id === list.id)

          if (baseList && localList && serverList) {
            const cardMergeResult = mergeCards(
              baseList.cards || [],
              localList.cards || [],
              serverList.cards || []
            )

            finalLists.push({
              ...list,
              cards: cardMergeResult.merged,
            })

            allConflicts.push(...cardMergeResult.conflicts)
          } else {
            finalLists.push(list)
          }
        }

        if (allConflicts.length > 0) {
          setConflicts(allConflicts)
          if (onConflict) {
            onConflict(allConflicts)
          }
          return { conflicts: allConflicts, merged: null }
        }

        // No conflicts - update base version and return merged state
        const mergedState = { lists: finalLists }
        baseVersionStorage.save(mergedState)
        setIsSyncing(false)
        return { conflicts: [], merged: mergedState }
      } catch (error) {
        console.error('Sync failed:', error)
        setIsSyncing(false)
        return { conflicts: [], merged: null, error }
      }
    },
    [onConflict]
  )

  const resolveConflict = useCallback(
    (conflictId, resolvedItem, type) => {
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId))
      // The resolved item will be applied by the caller
      return resolvedItem
    },
    []
  )

  return {
    syncWithServer,
    resolveConflict,
    conflicts,
    isSyncing,
  }
}

