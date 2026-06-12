import {
  REGION_OBJECTIVES,
  REGION_OBJECTIVE_TYPES,
  OBJECTIVE_COMPLETION_TIERS,
  DIFFICULTY_MULTIPLIERS
} from '../config/constants.js'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function createRegionObjectiveEngine() {
  function generateCycleObjective(difficulty = 'normal', cycle = 1, storeCount = 4) {
    const allTypes = Object.values(REGION_OBJECTIVE_TYPES)
    const eligibleTypes = cycle <= 1
      ? allTypes.filter(t => t !== REGION_OBJECTIVE_TYPES.OVERALL_BALANCE)
      : allTypes

    const type = pickRandom(eligibleTypes)
    const baseConfig = REGION_OBJECTIVES[type]
    const difficultyMul = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0
    const cycleAdjust = 1 + (cycle - 1) * 0.05

    let targetValue = baseConfig.targetValueByDifficulty[difficulty] || baseConfig.targetValueByDifficulty.normal
    if (type === REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY) {
      targetValue = Math.round(targetValue * (1 + (storeCount - 4) * 0.03) * cycleAdjust)
    } else if (type === REGION_OBJECTIVE_TYPES.COST_CONTROL) {
      targetValue = Math.round(targetValue * difficultyMul)
    } else if (type === REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION) {
      targetValue = parseFloat((targetValue * Math.min(1.1, cycleAdjust)).toFixed(3))
    } else if (type === REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT) {
      targetValue = parseFloat((targetValue / Math.min(1.15, cycleAdjust)).toFixed(4))
    } else if (type === REGION_OBJECTIVE_TYPES.OVERALL_BALANCE) {
      targetValue = Math.round(targetValue * (1 + (cycle - 1) * 0.02))
    }

    return {
      type,
      name: baseConfig.name,
      icon: baseConfig.icon,
      description: baseConfig.description,
      shortDesc: baseConfig.shortDesc,
      guidance: baseConfig.guidance,
      metric: baseConfig.metric,
      targetValue,
      roundResults: [],
      cycleCompletion: null
    }
  }

  function calculateHighRiskStability(storeResults) {
    const highRiskStores = storeResults.filter(sr => {
      const store = sr._store || null
      return store ? store.riskLevel >= 3 : sr.riskScore >= 40
    })
    if (highRiskStores.length === 0) {
      return {
        actualValue: 0,
        ratio: 1.5,
        positiveFactors: ['本回合无高风险门店，目标天然达成'],
        negativeFactors: [],
        suggestions: ['保持当前分配策略，继续监控风险等级变化']
      }
    }
    const avgRisk = highRiskStores.reduce((s, sr) => s + sr.riskScore, 0) / highRiskStores.length
    return {
      actualValue: Math.round(avgRisk),
      metricLabel: '高风险门店平均风险分',
      _raw: { highRiskCount: highRiskStores.length, avgRisk }
    }
  }

  function calculateCostControl(storeResults) {
    const avgCost = storeResults.reduce((s, sr) => s + sr.cost, 0) / storeResults.length
    const aboveAvgStores = storeResults.filter(sr => sr.cost > avgCost * 1.2)
    return {
      actualValue: Math.round(avgCost),
      metricLabel: '单店平均运营成本',
      _raw: { avgCost, aboveAvgCount: aboveAvgStores.length }
    }
  }

  function calculateCustomerSatisfaction(storeResults) {
    const avgSat = storeResults.reduce((s, sr) => s + sr.satisfaction, 0) / storeResults.length
    const lowSatStores = storeResults.filter(sr => sr.satisfaction < 0.5)
    return {
      actualValue: parseFloat(avgSat.toFixed(4)),
      metricLabel: '区域平均满意度',
      _raw: { avgSat, lowSatCount: lowSatStores.length }
    }
  }

  function calculateReduceStockout(storeResults) {
    const avgRate = storeResults.reduce((s, sr) => s + sr.stockoutRate, 0) / storeResults.length
    const highStockoutStores = storeResults.filter(sr => sr.stockoutRate > 0.15)
    return {
      actualValue: parseFloat(avgRate.toFixed(4)),
      metricLabel: '区域平均缺货率',
      _raw: { avgRate, highStockoutCount: highStockoutStores.length }
    }
  }

  function calculateOverallBalance(storeResults) {
    const avgCost = storeResults.reduce((s, sr) => s + sr.cost, 0) / storeResults.length
    const avgSat = storeResults.reduce((s, sr) => s + sr.satisfaction, 0) / storeResults.length
    const avgRate = storeResults.reduce((s, sr) => s + sr.stockoutRate, 0) / storeResults.length
    const avgRisk = storeResults.reduce((s, sr) => s + sr.riskScore, 0) / storeResults.length

    const costScore = Math.max(0, Math.min(100, (700 - avgCost) / 4))
    const satScore = avgSat * 100
    const stockoutScore = Math.max(0, Math.min(100, (0.2 - avgRate) * 400))
    const riskScore = Math.max(0, Math.min(100, (100 - avgRisk) / 0.8))

    const balanceScore = (costScore + satScore + stockoutScore + riskScore) / 4
    return {
      actualValue: Math.round(balanceScore),
      metricLabel: '综合平衡得分',
      _raw: { costScore, satScore, stockoutScore, riskScore, avgCost, avgSat, avgRate, avgRisk }
    }
  }

  function calculateCompletionRatio(objective, actualValue) {
    const target = objective.targetValue
    let ratio = 0
    switch (objective.type) {
      case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY:
        ratio = actualValue <= 0 ? 1.5 : target / Math.max(actualValue, 1)
        break
      case REGION_OBJECTIVE_TYPES.COST_CONTROL:
        ratio = target / Math.max(actualValue, 1)
        break
      case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION:
        ratio = actualValue / Math.max(target, 0.01)
        break
      case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT:
        ratio = actualValue <= 0 ? 1.5 : target / Math.max(actualValue, 0.001)
        break
      case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE:
        ratio = actualValue / Math.max(target, 1)
        break
      default:
        ratio = 0
    }
    return parseFloat(Math.min(2.0, Math.max(0, ratio)).toFixed(3))
  }

  function determineTier(ratio) {
    for (const tier of OBJECTIVE_COMPLETION_TIERS) {
      if (ratio >= tier.minRatio) return tier
    }
    return OBJECTIVE_COMPLETION_TIERS[OBJECTIVE_COMPLETION_TIERS.length - 1]
  }

  function analyzeFactors(objective, storeResults, metricResult) {
    const positiveFactors = []
    const negativeFactors = []
    const suggestions = []
    const raw = metricResult._raw || {}

    switch (objective.type) {
      case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY: {
        const highRiskStores = storeResults.filter(sr => {
          const s = sr._store
          return s ? s.riskLevel >= 3 : sr.riskScore >= 40
        })
        if (highRiskStores.length === 0) {
          positiveFactors.push('本回合无高风险等级门店')
        } else {
          const underControl = highRiskStores.filter(sr => sr.riskScore <= objective.targetValue * 1.1)
          if (underControl.length > 0) {
            positiveFactors.push(`${underControl.length} 家高风险门店风险分已控制在安全区间`)
          }
          const outOfControl = highRiskStores.filter(sr => sr.riskScore > objective.targetValue * 1.1)
          if (outOfControl.length > 0) {
            negativeFactors.push(`${outOfControl.length} 家高风险门店风险分超出目标：${outOfControl.map(s => s.storeName).join('、')}`)
          }
        }
        storeResults.forEach(sr => {
          if (sr.riskEvent) {
            negativeFactors.push(`${sr.storeName} 触发风险事件【${sr.riskEvent.name}】推高风险分`)
          }
        })
        if (negativeFactors.length > 0) {
          suggestions.push('下回合优先向高风险门店追加库存、人手和陈列资源以降低风险')
          suggestions.push('关注触发风险事件的门店，针对性补充受影响的资源类型')
        } else {
          suggestions.push('高风险门店保持稳定，可适当向其他门店倾斜资源')
        }
        break
      }
      case REGION_OBJECTIVE_TYPES.COST_CONTROL: {
        const thrifty = storeResults.filter(sr => sr.cost < objective.targetValue * 0.9)
        const wasteful = storeResults.filter(sr => sr.cost > objective.targetValue * 1.15)
        if (thrifty.length > 0) {
          positiveFactors.push(`${thrifty.length} 家门店成本控制优秀：${thrifty.map(s => s.storeName).join('、')}`)
        }
        if (wasteful.length > 0) {
          negativeFactors.push(`${wasteful.length} 家门店成本偏高：${wasteful.map(s => s.storeName).join('、')}`)
        }
        if (negativeFactors.length === 0) {
          suggestions.push('整体成本控制良好，继续保持合理分配')
        } else {
          suggestions.push('检查成本偏高门店是否存在冗余资源，适当回收过剩分配')
          suggestions.push('优先满足核心需求，减少边际收益低的资源投入')
        }
        break
      }
      case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION: {
        const goodSat = storeResults.filter(sr => sr.satisfaction >= 0.7)
        const badSat = storeResults.filter(sr => sr.satisfaction < 0.5)
        if (goodSat.length > 0) {
          positiveFactors.push(`${goodSat.length} 家门店满意度 ≥ 70%：${goodSat.map(s => s.storeName).join('、')}`)
        }
        if (badSat.length > 0) {
          negativeFactors.push(`${badSat.length} 家门店满意度偏低：${badSat.map(s => s.storeName).join('、')}`)
        }
        if (negativeFactors.length === 0) {
          suggestions.push('顾客满意度表现优秀，继续保持当前策略')
        } else {
          suggestions.push('提升满意度需同时增加人手、陈列投入，并降低缺货率')
          suggestions.push('低满意度门店重点补充人手（👥）和陈列维护（✨）')
        }
        break
      }
      case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT: {
        const lowSo = storeResults.filter(sr => sr.stockoutRate <= 0.05)
        const highSo = storeResults.filter(sr => sr.stockoutRate > 0.12)
        if (lowSo.length > 0) {
          positiveFactors.push(`${lowSo.length} 家门店缺货率 ≤ 5%：${lowSo.map(s => s.storeName).join('、')}`)
        }
        if (highSo.length > 0) {
          negativeFactors.push(`${highSo.length} 家门店缺货率偏高：${highSo.map(s => s.storeName).join('、')}`)
        }
        if (negativeFactors.length === 0) {
          suggestions.push('缺货控制优秀，库存与配送分配合理')
        } else {
          suggestions.push('缺货率高的门店需增加库存量（📦）和配送次数（🚚）')
          suggestions.push('需求高的门店应优先保证库存充足')
        }
        break
      }
      case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE: {
        if (raw.costScore >= 70) positiveFactors.push(`成本维度表现良好（得分 ${Math.round(raw.costScore)}）`)
        else negativeFactors.push(`成本维度待优化（得分 ${Math.round(raw.costScore)}）`)
        if (raw.satScore >= 70) positiveFactors.push(`满意度维度表现良好（得分 ${Math.round(raw.satScore)}）`)
        else negativeFactors.push(`满意度维度待优化（得分 ${Math.round(raw.satScore)}）`)
        if (raw.stockoutScore >= 70) positiveFactors.push(`缺货控制表现良好（得分 ${Math.round(raw.stockoutScore)}）`)
        else negativeFactors.push(`缺货控制待优化（得分 ${Math.round(raw.stockoutScore)}）`)
        if (raw.riskScore >= 70) positiveFactors.push(`风险控制表现良好（得分 ${Math.round(raw.riskScore)}）`)
        else negativeFactors.push(`风险控制待优化（得分 ${Math.round(raw.riskScore)}）`)
        suggestions.push('均衡分配四类资源，避免某一维度过度薄弱')
        const weakest = [
          { name: '成本', score: raw.costScore, tip: '避免资源过度投入' },
          { name: '满意度', score: raw.satScore, tip: '增加人手和陈列维护' },
          { name: '缺货', score: raw.stockoutScore, tip: '优先保障库存和配送' },
          { name: '风险', score: raw.riskScore, tip: '重点关注高风险门店' }
        ].sort((a, b) => a.score - b.score)[0]
        if (weakest) {
          suggestions.push(`下回合重点补强「${weakest.name}」维度：${weakest.tip}`)
        }
        break
      }
    }

    return { positiveFactors, negativeFactors, suggestions }
  }

  function evaluateRoundObjective(objective, storeResults, stores) {
    const enrichedResults = storeResults.map((sr, idx) => ({
      ...sr,
      _store: stores ? stores[idx] : null
    }))

    let metricResult
    switch (objective.type) {
      case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY:
        metricResult = calculateHighRiskStability(enrichedResults)
        break
      case REGION_OBJECTIVE_TYPES.COST_CONTROL:
        metricResult = calculateCostControl(enrichedResults)
        break
      case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION:
        metricResult = calculateCustomerSatisfaction(enrichedResults)
        break
      case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT:
        metricResult = calculateReduceStockout(enrichedResults)
        break
      case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE:
        metricResult = calculateOverallBalance(enrichedResults)
        break
      default:
        metricResult = { actualValue: 0, metricLabel: objective.metric }
    }

    const ratio = calculateCompletionRatio(objective, metricResult.actualValue)
    const tier = determineTier(ratio)
    const factors = analyzeFactors(objective, enrichedResults, metricResult)

    const roundResult = {
      actualValue: metricResult.actualValue,
      metricLabel: metricResult.metricLabel || objective.metric,
      targetValue: objective.targetValue,
      completionRatio: ratio,
      tier: tier.tier,
      tierLabel: tier.label,
      bonusSP: tier.bonusSP,
      scoreMultiplier: tier.scoreMultiplier,
      positiveFactors: factors.positiveFactors,
      negativeFactors: factors.negativeFactors,
      suggestions: factors.suggestions.slice(0, 3)
    }

    return roundResult
  }

  function summarizeCycleObjective(objective) {
    if (!objective.roundResults || objective.roundResults.length === 0) {
      return null
    }
    const avgRatio = objective.roundResults.reduce((s, r) => s + r.completionRatio, 0) / objective.roundResults.length
    const totalBonusSP = objective.roundResults.reduce((s, r) => s + r.bonusSP, 0)
    const avgMultiplier = objective.roundResults.reduce((s, r) => s + r.scoreMultiplier, 0) / objective.roundResults.length
    const tier = determineTier(avgRatio)

    const counts = objective.roundResults.reduce((acc, r) => {
      acc[r.tier] = (acc[r.tier] || 0) + 1
      return acc
    }, {})

    return {
      type: objective.type,
      name: objective.name,
      icon: objective.icon,
      description: objective.description,
      targetValue: objective.targetValue,
      metric: objective.metric,
      avgCompletionRatio: parseFloat(avgRatio.toFixed(3)),
      finalTier: tier.tier,
      finalTierLabel: tier.label,
      totalBonusSP,
      avgScoreMultiplier: parseFloat(avgMultiplier.toFixed(3)),
      tierBreakdown: counts,
      guidance: objective.guidance
    }
  }

  function formatActualValue(objectiveType, value) {
    switch (objectiveType) {
      case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY:
        return `${value}`
      case REGION_OBJECTIVE_TYPES.COST_CONTROL:
        return `¥${value}`
      case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION:
        return `${(value * 100).toFixed(1)}%`
      case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT:
        return `${(value * 100).toFixed(1)}%`
      case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE:
        return `${value} 分`
      default:
        return `${value}`
    }
  }

  function formatTargetValue(objectiveType, value) {
    switch (objectiveType) {
      case REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY:
        return `≤ ${value}`
      case REGION_OBJECTIVE_TYPES.COST_CONTROL:
        return `≤ ¥${value}`
      case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION:
        return `≥ ${(value * 100).toFixed(1)}%`
      case REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT:
        return `≤ ${(value * 100).toFixed(1)}%`
      case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE:
        return `≥ ${value} 分`
      default:
        return `${value}`
    }
  }

  return {
    generateCycleObjective,
    evaluateRoundObjective,
    summarizeCycleObjective,
    formatActualValue,
    formatTargetValue,
    determineTier
  }
}
