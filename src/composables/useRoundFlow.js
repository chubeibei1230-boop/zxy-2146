import {
  GAME_PHASES,
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_SETTINGS
} from '../config/constants.js'
import { createStoreFactory, createRiskEventFactory, createResourcePoolFactory } from '../utils/factory.js'
import { createSettlementEngine } from '../utils/settlement.js'
import { createSaveSystem } from '../utils/saveSystem.js'
import { createRegionObjectiveEngine } from '../utils/regionObjective.js'

const storeFactory = createStoreFactory()
const riskFactory = createRiskEventFactory()
const resourcePoolFactory = createResourcePoolFactory()
const settlementEngine = createSettlementEngine()
const saveSystem = createSaveSystem()
const regionObjectiveEngine = createRegionObjectiveEngine()

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
    gameState.currentRoundObjectiveResult = null

    gameState.regionObjective = regionObjectiveEngine.generateCycleObjective(
      gameState.settings.difficulty,
      gameState.currentCycle,
      gameState.settings.storeCount
    )

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
    gameState.currentRoundObjectiveResult = null
    initRound()
    gameState.phase = GAME_PHASES.PLANNING
    onStateChange?.()
  }

  function finishCycle() {
    const baseSummary = settlementEngine.calculateCycleSummary(gameState.roundResults)

    let objectiveSummary = null
    let totalBonusSP = 0
    let avgMultiplier = 1.0
    if (gameState.regionObjective && gameState.regionObjective.roundResults && gameState.regionObjective.roundResults.length > 0) {
      objectiveSummary = regionObjectiveEngine.summarizeCycleObjective(gameState.regionObjective)
      if (objectiveSummary) {
        totalBonusSP = objectiveSummary.totalBonusSP
        avgMultiplier = objectiveSummary.avgScoreMultiplier
      }
    }

    const finalTotalScore = Math.round(baseSummary.totalScore * avgMultiplier)
    const finalStrategyPoints = baseSummary.strategyPoints + totalBonusSP
    const finalGrade = settlementEngine.calculateGrade(
      finalTotalScore,
      baseSummary.avgSatisfaction,
      baseSummary.avgStockoutRate
    )

    const summary = {
      ...baseSummary,
      totalScore: finalTotalScore,
      strategyPoints: finalStrategyPoints,
      grade: finalGrade,
      objectiveSummary,
      objectiveBonusSP: totalBonusSP,
      objectiveScoreMultiplier: avgMultiplier
    }

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
    gameState.regionObjective = null
    gameState.currentRoundObjectiveResult = null
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
    gameState.regionObjective = saved.regionObjective || null
    gameState.currentRoundObjectiveResult = saved.currentRoundObjectiveResult || null

    if (!gameState.regionObjective) {
      gameState.regionObjective = regionObjectiveEngine.generateCycleObjective(
        gameState.settings.difficulty,
        gameState.currentCycle,
        gameState.settings.storeCount
      )
    }

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
