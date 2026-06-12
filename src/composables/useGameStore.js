import { reactive, computed, ref } from 'vue'
import { createStoreFactory, createRiskEventFactory, createResourcePoolFactory } from '../utils/factory.js'
import { createSettlementEngine } from '../utils/settlement.js'
import { createSaveSystem } from '../utils/saveSystem.js'

const storeFactory = createStoreFactory()
const riskFactory = createRiskEventFactory()
const resourcePoolFactory = createResourcePoolFactory()
const settlementEngine = createSettlementEngine()
const saveSystem = createSaveSystem()

const TOTAL_ROUNDS = 10

export function useGameStore() {
  const gameState = reactive({
    phase: 'menu',
    currentCycle: 1,
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    stores: [],
    resourcePool: {
      total: { stock: 0, staff: 0, delivery: 0, display: 0 },
      remaining: { stock: 0, staff: 0, delivery: 0, display: 0 }
    },
    settings: {
      storeCount: 4,
      difficulty: 'normal'
    },
    roundResults: [],
    currentRoundResult: null,
    cycleSummary: null,
    unlocks: saveSystem.getDefaultUnlocks(),
    accumulatedStrategyPoints: 0,
    allocationHistory: [],
    showReport: false,
    role: 'planner'
  })

  const difficultyMultipliers = {
    normal: 1.0,
    hard: 1.3,
    extreme: 1.6
  }

  function initGame(settings = {}) {
    saveSystem.clearSavedGame()
    gameState.settings.storeCount = settings.storeCount || 4
    gameState.settings.difficulty = settings.difficulty || 'normal'
    gameState.currentCycle = settings.cycle || 1
    gameState.accumulatedStrategyPoints = settings.strategyPoints || 0
    gameState.currentRound = 1
    gameState.roundResults = []
    gameState.currentRoundResult = null
    gameState.cycleSummary = null
    gameState.allocationHistory = []
    gameState.unlocks = saveSystem.getUnlocks()

    initRound()
    gameState.phase = 'planning'
    saveSystem.saveGame(serializeGameState())
  }

  function initRound() {
    const diffMul = difficultyMultipliers[gameState.settings.difficulty] || 1.0
    const cycleMul = 1 + (gameState.currentCycle - 1) * 0.1

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

    saveSystem.saveGame(serializeGameState())
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
    saveSystem.saveGame(serializeGameState())
    return true
  }

  function confirmAllocation() {
    gameState.role = 'reviewer'
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

    gameState.phase = 'settlement'
    gameState.showReport = true
    saveSystem.saveGame(serializeGameState())
  }

  function nextRound() {
    if (gameState.currentRound >= gameState.totalRounds) {
      finishCycle()
      return
    }

    gameState.currentRound++
    initRound()
    gameState.phase = 'planning'
    saveSystem.saveGame(serializeGameState())
  }

  function finishCycle() {
    const summary = settlementEngine.calculateCycleSummary(gameState.roundResults)
    gameState.cycleSummary = summary
    gameState.phase = 'cycleComplete'

    gameState.unlocks = saveSystem.updateUnlocksWithCycleResult(summary, gameState.currentCycle)
    saveSystem.saveGame(serializeGameState())
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
    if (gameState.phase !== 'cycleComplete') {
      saveSystem.clearSavedGame()
    }
    gameState.phase = 'menu'
    gameState.stores = []
    gameState.roundResults = []
    gameState.currentRoundResult = null
  }

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
    gameState.showReport = saved.phase === 'settlement'

    return true
  }

  function setRole(role) {
    gameState.role = role
  }

  function triggerRoleHint() {
    if (gameState.role === 'planner') {
      return generatePlannerHint()
    } else if (gameState.role === 'hint') {
      return generateRiskHint()
    }
    return null
  }

  function generatePlannerHint() {
    const hints = []
    gameState.stores.forEach(store => {
      if (store.riskEvent) {
        hints.push(`${store.name} 触发了【${store.riskEvent.name}】: ${store.riskEvent.description}`)
      }
      if (store.riskLevel >= 3) {
        hints.push(`${store.name} 风险等级较高(${store.riskLevel}级)，建议重点关注`)
      }
    })
    const remaining = gameState.resourcePool.remaining
    const total = gameState.resourcePool.total
    Object.keys(remaining).forEach(key => {
      if (remaining[key] > total[key] * 0.3) {
        const info = resourcePoolFactory.getResourceInfo()[key]
        hints.push(`注意：${info.name}还有较多剩余，请合理分配`)
      }
    })
    return hints.length > 0 ? hints : ['各项指标正常，请继续优化分配方案']
  }

  function generateRiskHint() {
    return gameState.stores.map(store => {
      const riskDesc = ['低', '中', '高', '很高', '极高'][Math.min(store.riskLevel - 1, 4)]
      const eventDesc = store.riskEvent ? `，事件：${store.riskEvent.name}` : ''
      return `${store.name}：需求${store.demand}，风险${riskDesc}${eventDesc}`
    })
  }

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
    gameState,
    totalScore,
    averageSatisfaction,
    averageStockoutRate,
    resourceInfo,
    hasSavedGame,
    initGame,
    allocateResource,
    adjustResource,
    confirmAllocation,
    nextRound,
    startNewCycle,
    backToMenu,
    loadSavedGame,
    setRole,
    triggerRoleHint,
    getStoreCountOptions: saveSystem.getStoreCountOptions,
    getDifficultyOptions: saveSystem.getDifficultyOptions
  }
}
