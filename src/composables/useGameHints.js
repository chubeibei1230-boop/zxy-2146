import { computed } from 'vue'
import {
  RISK_LEVELS,
  ROLE_TYPES,
  RESOURCE_NAME_MAP,
  HINT_TEXTS
} from '../config/constants.js'
import { createResourcePoolFactory } from '../utils/factory.js'

const resourcePoolFactory = createResourcePoolFactory()

export function useGameHints(gameState) {
  const riskHints = computed(() => {
    return gameState.stores.map(store => {
      const riskDesc = RISK_LEVELS[Math.min(store.riskLevel - 1, 4)]
      const eventDesc = store.riskEvent ? `，触发【${store.riskEvent.name}】` : ''
      return `${store.name}（${store.type}）：需求 ${store.demand}，风险${riskDesc}${eventDesc}`
    })
  })

  const plannerHints = computed(() => {
    const hints = []
    gameState.stores.forEach(store => {
      if (store.riskEvent) {
        hints.push(`${store.name} 触发了【${store.riskEvent.name}】：${store.riskEvent.description}`)
      }
      if (store.riskLevel >= 3) {
        hints.push(`${store.name} 风险等级较高（${store.riskLevel}级），${HINT_TEXTS.highRiskLevel}`)
      }
    })
    const remaining = gameState.resourcePool.remaining
    const total = gameState.resourcePool.total
    Object.keys(remaining).forEach(key => {
      if (remaining[key] > total[key] * 0.3) {
        hints.push(`${RESOURCE_NAME_MAP[key]}${HINT_TEXTS.remainingResource}（${remaining[key]}/${total[key]}）`)
      }
    })
    if (hints.length === 0) {
      hints.push(HINT_TEXTS.plannerDefault)
    }
    return hints
  })

  function triggerRoleHint() {
    if (gameState.role === ROLE_TYPES.PLANNER) {
      return generatePlannerHint()
    } else if (gameState.role === ROLE_TYPES.HINT) {
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
      const riskDesc = RISK_LEVELS[Math.min(store.riskLevel - 1, 4)]
      const eventDesc = store.riskEvent ? `，事件：${store.riskEvent.name}` : ''
      return `${store.name}：需求${store.demand}，风险${riskDesc}${eventDesc}`
    })
  }

  return {
    riskHints,
    plannerHints,
    triggerRoleHint,
    generatePlannerHint,
    generateRiskHint
  }
}
