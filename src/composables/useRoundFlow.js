import {
  GAME_PHASES,
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_SETTINGS
} from '../config/constants.js'
import { createStoreFactory, createRiskEventFactory, createResourcePoolFactory } from '../utils/factory.js'
import { createSettlementEngine } from '../utils/settlement.js'
import { createSaveSystem } from '../utils/saveSystem.js'

const storeFactory = createStoreFactory()
const riskFactory = createRiskEventFactory()
const resourcePoolFactory = createResourcePoolFactory()
const settlementEngine = createSettlementEngine()
const saveSystem = createSaveSystem()

export function useRoundFlow(gameState, serializeState, onStateChange) {
  function getDifficultyMultiplier() {
    return DIFFICULTY_MULTIPLIERS[gameState.settings.difficulty] || 1.0
  }

  function getCycleMultiplier() {
    return 1 + (gameState.currentCycle - 1) * 0.1
  }

  function initRound() {
    const diffMul = getDifficultyMultiplier()
    const cycleMul = getCycleMultiplier()

    if (gameState.stores.length === 0 || gameState.stores.length !== gameState.settings.storeCount) {
      gameState.stores = storeFactory.generateStores(
        gameState.settings.storeCount,
        gameState.currentCycle,
        diffMul * cycleMul
      )
    } else {
      gameState.stores = gameState.stores.map(store =>
        storeFactory.refreshStoreDemand({ ...store }, gameState.currentCycle)
      )
    }

    gameState.stores = riskFactory.generateRoundRisks(gameState.stores, gameState.currentCycle)

    const resources = resourcePoolFactory.calculateBaseResources(
      gameState.currentCycle,
      gameState.settings.storeCount,
      gameState.accumulatedStrategyPoints
    )
    gameState.resourcePool.total = { ...resources }
    gameState.resourcePool.remaining = { ...resources }

    gameState.showReport = false
    gameState.role = 'planner'
  }

  function initGame(settings = {}) {
    saveSystem.clearSavedGame()
    gameState.settings.storeCount = settings.storeCount || DEFAULT_SETTINGS.storeCount
    gameState.settings.difficulty = settings.difficulty || DEFAULT_SETTINGS.difficulty
    gameState.currentCycle = settings.cycle || 1
    gameState.accumulatedStrategyPoints = settings.strategyPoints || 0
    gameState.currentRound = 1
    gameState.roundResults = []
    gameState.currentRoundResult = null
    gameState.cycleSummary = null
    gameState.allocationHistory = []
    gameState.unlocks = saveSystem.getUnlocks()

    initRound()
    gameState.phase = GAME_PHASES.PLANNING
    onStateChange?.()
  }

  function nextRound() {
    if (gameState.currentRound >= gameState.totalRounds) {
      finishCycle()
      return
    }

    gameState.currentRound++
    initRound()
    gameState.phase = GAME_PHASES.PLANNING
    onStateChange?.()
  }

  function finishCycle() {
    const summary = settlementEngine.calculateCycleSummary(gameState.roundResults)
    gameState.cycleSummary = summary
    gameState.phase = GAME_PHASES.CYCLE_COMPLETE

    gameState.unlocks = saveSystem.updateUnlocksWithCycleResult(summary, gameState.currentCycle)
    onStateChange?.()
  }

  function startNewCycle() {
    if (!gameState.cycleSummary) return

    const newCycle = gameState.currentCycle + 1
    const earnedSP = gameState.cycleSummary.strategyPoints
    const carriedSP = Math.round(earnedSP * 0.6) + Math.round(gameState.accumulatedStrategyPoints * 0.3)

    let newStoreCount = gameState.settings.storeCount
    const maxUnlocked = Math.max(...saveSystem.getStoreCountOptions().filter(o => o.unlocked).map(o => o.value))
    if (newCycle % 2 === 0 && newStoreCount < maxUnlocked) {
      newStoreCount = Math.min(newStoreCount + 1, maxUnlocked)
    }

    gameState.stores = []
    initGame({
      storeCount: newStoreCount,
      difficulty: gameState.settings.difficulty,
      cycle: newCycle,
      strategyPoints: carriedSP
    })
  }

  function backToMenu() {
    if (gameState.phase !== GAME_PHASES.CYCLE_COMPLETE) {
      saveSystem.clearSavedGame()
    }
    gameState.phase = GAME_PHASES.MENU
    gameState.stores = []
    gameState.roundResults = []
    gameState.currentRoundResult = null
  }

  function loadSavedGame() {
    const saved = saveSystem.loadGame()
    if (!saved) return false

    gameState.phase = saved.phase
    gameState.currentCycle = saved.currentCycle
    gameState.currentRound = saved.currentRound
    gameState.totalRounds = saved.totalRounds
    gameState.stores = saved.stores
    gameState.resourcePool = saved.resourcePool
    gameState.settings = saved.settings
    gameState.roundResults = saved.roundResults
    gameState.currentRoundResult = saved.currentRoundResult
    gameState.allocationHistory = saved.allocationHistory || []
    gameState.accumulatedStrategyPoints = saved.accumulatedStrategyPoints || 0
    gameState.unlocks = saveSystem.getUnlocks()
    gameState.showReport = saved.phase === GAME_PHASES.SETTLEMENT

    return true
  }

  return {
    initGame,
    initRound,
    nextRound,
    finishCycle,
    startNewCycle,
    backToMenu,
    loadSavedGame
  }
}
