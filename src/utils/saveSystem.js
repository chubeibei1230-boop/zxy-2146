import { SAVE_KEYS, GRADE_RANK } from '../config/constants.js'

const SAVE_KEY = SAVE_KEYS.game
const UNLOCK_KEY = SAVE_KEYS.unlocks

export function createSaveSystem() {
  function saveGame(gameState) {
    try {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        ...gameState
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      return true
    } catch (e) {
      console.error('保存游戏失败:', e)
      return false
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      const saveData = JSON.parse(raw)
      if (saveData.version !== 1) {
        console.warn('存档版本不兼容')
        return null
      }
      return saveData
    } catch (e) {
      console.error('加载游戏失败:', e)
      return null
    }
  }

  function hasSavedGame() {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY)
  }

  function getUnlocks() {
    try {
      const raw = localStorage.getItem(UNLOCK_KEY)
      if (!raw) return getDefaultUnlocks()
      const unlocks = JSON.parse(raw)
      return { ...getDefaultUnlocks(), ...unlocks }
    } catch (e) {
      console.error('加载解锁数据失败:', e)
      return getDefaultUnlocks()
    }
  }

  function saveUnlocks(unlocks) {
    try {
      localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocks))
      return true
    } catch (e) {
      console.error('保存解锁数据失败:', e)
      return false
    }
  }

  function getDefaultUnlocks() {
    return {
      maxCycleCompleted: 0,
      bestGrade: 'D',
      bestScore: 0,
      totalStrategyPoints: 0,
      unlockedFeatures: {
        storeCount_5: false,
        storeCount_6: false,
        storeCount_7: false,
        storeCount_8: false,
        difficulty_hard: false,
        difficulty_extreme: false
      },
      cycleHistory: []
    }
  }

  function updateUnlocksWithCycleResult(cycleSummary, cycleNumber) {
    const current = getUnlocks()
    const updated = { ...current }

    updated.maxCycleCompleted = Math.max(current.maxCycleCompleted, cycleNumber)
    updated.totalStrategyPoints = current.totalStrategyPoints + cycleSummary.strategyPoints
    updated.bestScore = Math.max(current.bestScore, cycleSummary.totalScore)

    if (GRADE_RANK[cycleSummary.grade] > GRADE_RANK[current.bestGrade]) {
      updated.bestGrade = cycleSummary.grade
    }

    updated.unlockedFeatures = { ...current.unlockedFeatures }
    if (updated.maxCycleCompleted >= 1) updated.unlockedFeatures.storeCount_5 = true
    if (updated.maxCycleCompleted >= 2) updated.unlockedFeatures.storeCount_6 = true
    if (updated.maxCycleCompleted >= 3 || updated.bestScore >= 6000) updated.unlockedFeatures.storeCount_7 = true
    if (updated.maxCycleCompleted >= 5 || updated.bestGrade === 'S') updated.unlockedFeatures.storeCount_8 = true
    if (updated.maxCycleCompleted >= 2) updated.unlockedFeatures.difficulty_hard = true
    if (updated.maxCycleCompleted >= 4 && updated.bestGrade !== 'D') updated.unlockedFeatures.difficulty_extreme = true

    updated.cycleHistory = [
      ...current.cycleHistory,
      {
        cycle: cycleNumber,
        grade: cycleSummary.grade,
        score: cycleSummary.totalScore,
        satisfaction: cycleSummary.avgSatisfaction,
        stockoutRate: cycleSummary.avgStockoutRate,
        strategyPoints: cycleSummary.strategyPoints,
        completedAt: Date.now()
      }
    ].slice(-20)

    saveUnlocks(updated)
    return updated
  }

  function getStoreCountOptions() {
    const unlocks = getUnlocks()
    const options = [{ value: 4, label: '4 家门店（基础）', unlocked: true }]
    if (unlocks.unlockedFeatures.storeCount_5) options.push({ value: 5, label: '5 家门店', unlocked: true })
    if (unlocks.unlockedFeatures.storeCount_6) options.push({ value: 6, label: '6 家门店', unlocked: true })
    if (unlocks.unlockedFeatures.storeCount_7) options.push({ value: 7, label: '7 家门店', unlocked: true })
    if (unlocks.unlockedFeatures.storeCount_8) options.push({ value: 8, label: '8 家门店', unlocked: true })
    return options
  }

  function getDifficultyOptions() {
    const unlocks = getUnlocks()
    const options = [
      { value: 'normal', label: '普通模式', multiplier: 1.0, unlocked: true, description: '标准难度' },
      { value: 'hard', label: '困难模式', multiplier: 1.3, unlocked: unlocks.unlockedFeatures.difficulty_hard, description: '需求更高，风险更多' },
      { value: 'extreme', label: '极限模式', multiplier: 1.6, unlocked: unlocks.unlockedFeatures.difficulty_extreme, description: '极限挑战，资源紧张' }
    ]
    return options
  }

  return {
    saveGame,
    loadGame,
    hasSavedGame,
    clearSavedGame,
    getUnlocks,
    saveUnlocks,
    getDefaultUnlocks,
    updateUnlocksWithCycleResult,
    getStoreCountOptions,
    getDifficultyOptions
  }
}
