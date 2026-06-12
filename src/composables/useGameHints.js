import { computed } from 'vue'
import {
  RISK_LEVELS,
  ROLE_TYPES,
  RESOURCE_NAME_MAP,
  HINT_TEXTS,
  REGION_OBJECTIVE_TYPES
} from '../config/constants.js'
import { createResourcePoolFactory } from '../utils/factory.js'

const resourcePoolFactory = createResourcePoolFactory()

function buildObjectiveAdvice(objective, stores) {
  if (!objective) return null
  const advices = []
  switch (objective.type) {
    case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT: {
      const sortedByDemand = [...stores].sort((a, b) => b.demand - a.demand)
      const topStores = sortedByDemand.slice(0, Math.min(2, sortedByDemand.length))
      advices.push({
        priority: 'high',
        text: `🎯【${objective.name}】优先保障库存(📦)和配送(🚚)，目标区域平均缺货率≤${(objective.targetValue * 100).toFixed(1)}%`
      })
      advices.push({
        priority: 'high',
        text: `重点门店：${topStores.map(s => s.name).join('、')} 需求最高，需优先分配库存和配送`
      })
      const riskStores = stores.filter(s => s.riskEvent && (s.riskEvent.demandMultiplier || s.riskEvent.stockThreshold))
      if (riskStores.length > 0) {
        advices.push({
          priority: 'high',
          text: `风险警告：${riskStores.map(s => s.name).join('、')} 存在缺货相关风险事件，需额外加量`
        })
      }
      advices.push({
        priority: 'medium',
        text: '分配建议：📦库存 + 🚚配送 应占总资源的 60% 以上'
      })
      break
    }
    case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION: {
      const lowSatStores = stores.filter(s => (s.currentSatisfaction || 0.5) < 0.6)
      advices.push({
        priority: 'high',
        text: `🎯【${objective.name}】提升人手(👥)与陈列(✨)，目标区域平均满意度≥${(objective.targetValue * 100).toFixed(1)}%`
      })
      if (lowSatStores.length > 0) {
        advices.push({
          priority: 'high',
          text: `低满意度门店：${lowSatStores.map(s => s.name).join('、')} 需重点补充 👥人手 和 ✨陈列`
        })
      }
      advices.push({
        priority: 'medium',
        text: '同时要注意 📦库存 不能太低，缺货会严重影响满意度'
      })
      break
    }
    case REGION_OBJECTIVE_TYPES.COST_CONTROL: {
      advices.push({
        priority: 'high',
        text: `🎯【${objective.name}】控制单店平均成本≤¥${objective.targetValue}，避免过度投入`
      })
      advices.push({
        priority: 'high',
        text: '成本构成：👥人 ¥8/单位 > 🚚配送 ¥12/单位 > ✨陈列 ¥3/单位 > 📦库存 ¥2/单位'
      })
      advices.push({
        priority: 'medium',
        text: '省钱建议：优先使用 📦库存(最便宜)，减少 👥人手 和 🚚配送 的冗余投入'
      })
      const lowDemandStores = stores.filter(s => s.demand < 10)
      if (lowDemandStores.length > 0) {
        advices.push({
          priority: 'medium',
          text: `低需求门店（${lowDemandStores.map(s => s.name).join('、')}）资源投入应保守`
        })
      }
      break
    }
    case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY: {
      const highRiskStores = stores.filter(s => s.riskLevel >= 3)
      advices.push({
        priority: 'high',
        text: `🎯【${objective.name}】高风险门店风险分控制在 ≤${objective.targetValue}`
      })
      if (highRiskStores.length > 0) {
        advices.push({
          priority: 'high',
          text: `高风险门店（${highRiskStores.map(s => `${s.name}(${s.riskLevel}级)`).join('、')}）需四类资源均衡足量投入`
        })
      } else {
        advices.push({
          priority: 'medium',
          text: '当前无高风险门店，保持稳健分配即可'
        })
      }
      advices.push({
        priority: 'medium',
        text: '降风险手段：📦库存降缺货 + 👥人手提服务 + ✨陈列提体验，三维共同发力'
      })
      break
    }
    case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE: {
      advices.push({
        priority: 'high',
        text: `🎯【${objective.name}】综合平衡得分 ≥${objective.targetValue} 分，需均衡发展四个维度`
      })
      advices.push({
        priority: 'medium',
        text: '四维度：📦缺货控制 + 😊满意度(👥+✨) + 💰成本控制 + ⚠️风险控制'
      })
      advices.push({
        priority: 'medium',
        text: '避免把大量资源集中在单一维度，否则其他维度会严重拖累平衡得分'
      })
      break
    }
  }
  return advices
}

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

    const objectiveAdvices = buildObjectiveAdvice(gameState.regionObjective, gameState.stores)
    if (objectiveAdvices) {
      objectiveAdvices
        .filter(a => a.priority === 'high')
        .forEach(a => hints.push(a.text))
    }

    gameState.stores.forEach(store => {
      if (store.riskEvent) {
        hints.push(`${store.name} 触发了【${store.riskEvent.name}】：${store.riskEvent.description}`)
      }
      if (store.riskLevel >= 3) {
        hints.push(`${store.name} 风险等级较高（${store.riskLevel}级），${HINT_TEXTS.highRiskLevel}`)
      }
    })

    if (objectiveAdvices) {
      objectiveAdvices
        .filter(a => a.priority === 'medium')
        .forEach(a => hints.push(a.text))
    }

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

    const objectiveAdvices = buildObjectiveAdvice(gameState.regionObjective, gameState.stores)
    if (objectiveAdvices) {
      objectiveAdvices
        .filter(a => a.priority === 'high')
        .forEach(a => hints.push(a.text))
    }

    gameState.stores.forEach(store => {
      if (store.riskEvent) {
        hints.push(`${store.name} 触发了【${store.riskEvent.name}】: ${store.riskEvent.description}`)
      }
      if (store.riskLevel >= 3) {
        hints.push(`${store.name} 风险等级较高(${store.riskLevel}级)，建议重点关注`)
      }
    })

    if (objectiveAdvices) {
      objectiveAdvices
        .filter(a => a.priority === 'medium')
        .forEach(a => hints.push(a.text))
    }

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
