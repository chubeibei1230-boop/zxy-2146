import { reactive } from 'vue'
import {
  TOTAL_ROUNDS,
  GAME_PHASES,
  DEFAULT_SETTINGS,
  RESOURCE_TYPES
} from '../config/constants.js'
import { createSaveSystem } from '../utils/saveSystem.js'

const saveSystem = createSaveSystem()

export function createInitialState() {
  return {
    phase: GAME_PHASES.MENU,
    currentCycle: 1,
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    stores: [],
    resourcePool: {
      total: {
        [RESOURCE_TYPES.stock]: 0,
        [RESOURCE_TYPES.staff]: 0,
        [RESOURCE_TYPES.delivery]: 0,
        [RESOURCE_TYPES.display]: 0
      },
      remaining: {
        [RESOURCE_TYPES.stock]: 0,
        [RESOURCE_TYPES.staff]: 0,
        [RESOURCE_TYPES.delivery]: 0,
        [RESOURCE_TYPES.display]: 0
      }
    },
    settings: { ...DEFAULT_SETTINGS },
    roundResults: [],
    currentRoundResult: null,
    cycleSummary: null,
    unlocks: saveSystem.getDefaultUnlocks(),
    accumulatedStrategyPoints: 0,
    allocationHistory: [],
    showReport: false,
    role: 'planner'
  }
}

export function useGameState() {
  const gameState = reactive(createInitialState())

  function resetState() {
    Object.assign(gameState, createInitialState())
  }

  function setPhase(phase) {
    gameState.phase = phase
  }

  function setRole(role) {
    gameState.role = role
  }

  function setSettings(settings) {
    gameState.settings = { ...gameState.settings, ...settings }
  }

  return {
    gameState,
    resetState,
    setPhase,
    setRole,
    setSettings
  }
}
