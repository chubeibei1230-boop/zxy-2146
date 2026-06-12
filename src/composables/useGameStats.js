import { computed } from 'vue'
import { createResourcePoolFactory } from '../utils/factory.js'
import { createSaveSystem } from '../utils/saveSystem.js'

const resourcePoolFactory = createResourcePoolFactory()
const saveSystem = createSaveSystem()

export function useGameStats(gameState) {
  const totalScore = computed(() => {
    return gameState.roundResults.reduce((sum, r) => sum + r.summary.roundScore, 0)
  })

  const averageSatisfaction = computed(() => {
    if (gameState.roundResults.length === 0) return 0
    const sum = gameState.roundResults.reduce((sum, r) => sum + r.summary.avgSatisfaction, 0)
    return parseFloat((sum / gameState.roundResults.length).toFixed(4))
  })

  const averageStockoutRate = computed(() => {
    if (gameState.roundResults.length === 0) return 0
    const sum = gameState.roundResults.reduce((sum, r) => sum + r.summary.avgStockoutRate, 0)
    return parseFloat((sum / gameState.roundResults.length).toFixed(4))
  })

  const resourceInfo = computed(() => resourcePoolFactory.getResourceInfo())
  const hasSavedGame = computed(() => saveSystem.hasSavedGame())

  return {
    totalScore,
    averageSatisfaction,
    averageStockoutRate,
    resourceInfo,
    hasSavedGame
  }
}
