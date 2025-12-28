// Three-way merge utility for conflict resolution

/**
 * Performs a three-way merge between base, local, and server versions
 * @param {Object} base - The base version (last synced state)
 * @param {Object} local - The local version (current offline state)
 * @param {Object} server - The server version (authoritative)
 * @returns {Object} - Merged result or null if manual resolution needed
 */
export function threeWayMerge(base, local, server) {
  // If server is newer and local hasn't changed, use server
  if (
    server.version > base.version &&
    local.version === base.version
  ) {
    return { resolved: server, strategy: 'server' }
  }

  // If local is newer and server hasn't changed, use local
  if (
    local.version > base.version &&
    server.version === base.version
  ) {
    return { resolved: local, strategy: 'local' }
  }

  // If both changed, need manual merge
  if (local.version > base.version && server.version > base.version) {
    return { resolved: null, strategy: 'conflict', base, local, server }
  }

  // If versions are equal, prefer server (authoritative)
  if (local.version === server.version) {
    return { resolved: server, strategy: 'server' }
  }

  // Default: use server
  return { resolved: server, strategy: 'server' }
}

/**
 * Merge lists with conflict detection
 */
export function mergeLists(baseLists, localLists, serverLists) {
  const merged = []
  const conflicts = []

  // Create maps for easier lookup
  const baseMap = new Map(baseLists.map((l) => [l.id, l]))
  const localMap = new Map(localLists.map((l) => [l.id, l]))
  const serverMap = new Map(serverLists.map((l) => [l.id, l]))

  // Get all unique list IDs
  const allIds = new Set([
    ...baseLists.map((l) => l.id),
    ...localLists.map((l) => l.id),
    ...serverLists.map((l) => l.id),
  ])

  for (const id of allIds) {
    const base = baseMap.get(id)
    const local = localMap.get(id)
    const server = serverMap.get(id)

    // List was deleted locally but exists on server
    if (!local && base && server) {
      // Use server version (undelete)
      merged.push(server)
      continue
    }

    // List was deleted on server but exists locally
    if (local && base && !server) {
      // Keep local (was deleted on server)
      continue
    }

    // List was added locally but not on server
    if (local && !base && !server) {
      merged.push(local)
      continue
    }

    // List was added on server but not locally
    if (server && !base && !local) {
      merged.push(server)
      continue
    }

    // List exists in all three - merge
    if (base && local && server) {
      const mergeResult = threeWayMerge(base, local, server)
      if (mergeResult.resolved) {
        merged.push(mergeResult.resolved)
      } else {
        conflicts.push({
          type: 'list',
          id,
          ...mergeResult,
        })
      }
    } else if (local && server) {
      // Exists in local and server but not base (both added)
      // Prefer server (authoritative)
      merged.push(server)
    }
  }

  return { merged, conflicts }
}

/**
 * Merge cards within a list
 */
export function mergeCards(baseCards, localCards, serverCards) {
  const merged = []
  const conflicts = []

  const baseMap = new Map(baseCards.map((c) => [c.id, c]))
  const localMap = new Map(localCards.map((c) => [c.id, c]))
  const serverMap = new Map(serverCards.map((c) => [c.id, c]))

  const allIds = new Set([
    ...baseCards.map((c) => c.id),
    ...localCards.map((c) => c.id),
    ...serverCards.map((c) => c.id),
  ])

  for (const id of allIds) {
    const base = baseMap.get(id)
    const local = localMap.get(id)
    const server = serverMap.get(id)

    // Card was deleted locally but exists on server
    if (!local && base && server) {
      merged.push(server)
      continue
    }

    // Card was deleted on server but exists locally
    if (local && base && !server) {
      continue
    }

    // Card was added locally
    if (local && !base && !server) {
      merged.push(local)
      continue
    }

    // Card was added on server
    if (server && !base && !local) {
      merged.push(server)
      continue
    }

    // Card exists in all three - merge
    if (base && local && server) {
      const mergeResult = threeWayMerge(base, local, server)
      if (mergeResult.resolved) {
        merged.push(mergeResult.resolved)
      } else {
        conflicts.push({
          type: 'card',
          id,
          ...mergeResult,
        })
      }
    } else if (local && server) {
      merged.push(server)
    }
  }

  return { merged, conflicts }
}

