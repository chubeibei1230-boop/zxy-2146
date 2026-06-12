import { GAME_PHASES, ROLE_TYPES } from '../config/constants.js'
import { createSettlementEngine } from '../utils/settlement.js'

const settlementEngine = createSettlementEngine()

export function useResourceAllocation(gameState, onStateChange) {
  function allocateResource(storeId, resourceType, amount) {
    const store = gameState.stores.find(s => s.id === storeId)
    if (!store) return false

    const currentAmount = store.allocatedResources[resourceType]
    const change = amount - currentAmount

    if (change > 0 && gameState.resourcePool.remaining[resourceType] < change) {
      store.allocatedResources[resourceType] = currentAmount + gameState.resourcePool.remaining[resourceType]
      gameState.resourcePool.remaining[resourceType] = 0
    } else {
      store.allocatedResources[resourceType] = Math.max(0, amount)
      gameState.resourcePool.remaining[resourceType] = Math.max(0, gameState.resourcePool.remaining[resourceType] - change)
    }

    onStateChange?.()
    return true
  }

  function adjustResource(storeId, resourceType, delta) {
    const store = gameState.stores.find(s => s.id === storeId)
    if (!store) return false

    const currentAmount = store.allocatedResources[resourceType]
    const newAmount = currentAmount + delta

    if (delta > 0 && gameState.resourcePool.remaining[resourceType] < delta) {
      return false
    }
    if (newAmount < 0) return false

    store.allocatedResources[resourceType] = newAmount
    gameState.resourcePool.remaining[resourceType] -= delta
    onStateChange?.()
    return true
  }

  function confirmAllocation() {
    gameState.role = ROLE_TYPES.REVIEWER
    const result = settlementEngine.calculateRoundResult(gameState.stores)
    gameState.currentRoundResult = result

    gameState.stores.forEach((store, idx) => {
      const storeResult = result.storeResults[idx]
      store.currentSatisfaction = storeResult.satisfaction
      store.currentStockoutRate = storeResult.stockoutRate
      store.currentRiskScore = storeResult.riskScore
    })

    gameState.roundResults.push({
      round: gameState.currentRound,
      ...result
    })

    gameState.allocationHistory.push({
      round: gameState.currentRound,
      allocations: gameState.stores.map(s => ({
        storeId: s.id,
        resources: { ...s.allocatedResources }
      }))
    })

    gameState.phase = GAME_PHASES.SETTLEMENT
    gameState.showReport = true
    onStateChange?.()
  }

  return {
    allocateResource,
    adjustResource,
    confirmAllocation
  }
}
