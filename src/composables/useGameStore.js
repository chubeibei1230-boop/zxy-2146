import { useGameState } from './useGameState.js'
import { useRoundFlow } from './useRoundFlow.js'
import { useResourceAllocation } from './useResourceAllocation.js'
import { useGameHints } from './useGameHints.js'
import { useGameStats } from './useGameStats.js'
import { createSaveSystem } from '../utils/saveSystem.js'

const saveSystem = createSaveSystem()

export function useGameStore() {
  const { gameState, setRole } = useGameState()

  function serializeGameState() {
    return {
      phase: gameState.phase,
      currentCycle: gameState.currentCycle,
      currentRound: gameState.currentRound,
      totalRounds: gameState.totalRounds,
      stores: JSON.parse(JSON.stringify(gameState.stores)),
      resourcePool: JSON.parse(JSON.stringify(gameState.resourcePool)),
      settings: { ...gameState.settings },
      roundResults: JSON.parse(JSON.stringify(gameState.roundResults)),
      currentRoundResult: gameState.currentRoundResult ? JSON.parse(JSON.stringify(gameState.currentRoundResult)) : null,
      cycleSummary: gameState.cycleSummary ? JSON.parse(JSON.stringify(gameState.cycleSummary)) : null,
      allocationHistory: JSON.parse(JSON.stringify(gameState.allocationHistory)),
      accumulatedStrategyPoints: gameState.accumulatedStrategyPoints
    }
  }

  function handleStateChange() {
    saveSystem.saveGame(serializeGameState())
  }

  const roundFlow = useRoundFlow(gameState, serializeGameState, handleStateChange)
  const resourceAllocation = useResourceAllocation(gameState, handleStateChange)
  const hints = useGameHints(gameState)
  const stats = useGameStats(gameState)

  return {
    gameState,
    ...stats,
    ...hints,
    ...roundFlow,
    ...resourceAllocation,
    setRole,
    getStoreCountOptions: saveSystem.getStoreCountOptions,
    getDifficultyOptions: saveSystem.getDifficultyOptions
  }
}
