export function createSettlementEngine() {
  function calculateStockoutRate(store) {
    const { demand, allocatedResources, riskEvent } = store
    const stock = allocatedResources.stock
    const delivery = allocatedResources.delivery

    let effectiveStock = stock + delivery * 0.5

    if (riskEvent) {
      if (riskEvent.demandMultiplier) {
        effectiveStock /= riskEvent.demandMultiplier
      }
      if (riskEvent.deliveryPenalty) {
        effectiveStock -= delivery * riskEvent.deliveryPenalty
      }
      if (riskEvent.stockThreshold) {
        effectiveStock /= riskEvent.stockThreshold
      }
    }

    const ratio = effectiveStock / demand
    let stockoutRate = 0

    if (ratio >= 1) {
      stockoutRate = Math.max(0, 0.02 - (ratio - 1) * 0.03)
    } else if (ratio >= 0.8) {
      stockoutRate = (1 - ratio) * 0.2
    } else if (ratio >= 0.5) {
      stockoutRate = 0.04 + (0.8 - ratio) * 0.4
    } else {
      stockoutRate = 0.16 + (0.5 - ratio) * 0.6
    }

    return Math.min(0.8, Math.max(0, parseFloat(stockoutRate.toFixed(4))))
  }

  function calculateSatisfaction(store, stockoutRate) {
    const { allocatedResources, satisfactionBase, riskEvent } = store
    const staff = allocatedResources.staff
    const display = allocatedResources.display

    let effectiveStaff = staff
    let effectiveDisplay = display

    if (riskEvent) {
      if (riskEvent.staffPenalty) {
        effectiveStaff *= (1 - riskEvent.staffPenalty)
      }
      if (riskEvent.staffMultiplier) {
        effectiveStaff /= riskEvent.staffMultiplier
      }
      if (riskEvent.displayPenalty) {
        effectiveDisplay *= (1 - riskEvent.displayPenalty)
      }
      if (riskEvent.displayMultiplier) {
        effectiveDisplay /= riskEvent.displayMultiplier
      }
      if (riskEvent.satisfactionThreshold) {
      }
    }

    const staffScore = Math.min(1, effectiveStaff / 10) * 0.25
    const displayScore = Math.min(1, effectiveDisplay / 15) * 0.2
    const stockoutPenalty = stockoutRate * 0.4
    const eventPenalty = riskEvent?.satisfactionPenalty || 0

    let satisfaction = satisfactionBase * 0.3 + staffScore + displayScore - stockoutPenalty - eventPenalty

    if (riskEvent?.satisfactionThreshold) {
      satisfaction = (satisfaction / riskEvent.satisfactionThreshold)
    }

    return Math.min(1, Math.max(0, parseFloat(satisfaction.toFixed(4))))
  }

  function calculateCost(store) {
    const { allocatedResources } = store
    const stock = allocatedResources.stock
    const staff = allocatedResources.staff
    const delivery = allocatedResources.delivery
    const display = allocatedResources.display

    const cost = stock * 2 + staff * 8 + delivery * 12 + display * 3

    return Math.round(cost)
  }

  function calculateRiskScore(store, stockoutRate, satisfaction) {
    const { riskLevel, riskEvent, sizeMultiplier } = store

    let baseRisk = riskLevel * 10

    const stockoutRisk = stockoutRate * 50

    const satisfactionRisk = Math.max(0, (0.5 - satisfaction)) * 60

    const eventRisk = riskEvent ? riskEvent.riskLevel * 15 : 0

    const sizeRisk = (sizeMultiplier - 1) * 20

    const totalRisk = baseRisk + stockoutRisk + satisfactionRisk + eventRisk + sizeRisk

    return Math.round(totalRisk)
  }

  function calculateStoreResult(store) {
    const stockoutRate = calculateStockoutRate(store)
    const satisfaction = calculateSatisfaction(store, stockoutRate)
    const cost = calculateCost(store)
    const riskScore = calculateRiskScore(store, stockoutRate, satisfaction)

    return {
      storeId: store.id,
      storeName: store.name,
      stockoutRate,
      satisfaction,
      cost,
      riskScore,
      demand: store.demand,
      allocatedResources: { ...store.allocatedResources },
      riskEvent: store.riskEvent
    }
  }

  function calculateRoundResult(stores) {
    const storeResults = stores.map(calculateStoreResult)

    const totalCost = storeResults.reduce((sum, r) => sum + r.cost, 0)
    const avgStockoutRate = storeResults.reduce((sum, r) => sum + r.stockoutRate, 0) / storeResults.length
    const avgSatisfaction = storeResults.reduce((sum, r) => sum + r.satisfaction, 0) / storeResults.length
    const totalRiskScore = storeResults.reduce((sum, r) => sum + r.riskScore, 0)

    const stockoutScore = Math.max(0, Math.round((1 - avgStockoutRate) * 400))
    const satisfactionScore = Math.round(avgSatisfaction * 300)
    const costScore = Math.max(0, 500 - Math.round(totalCost / storeResults.length / 5))
    const riskScorePenalty = Math.round(totalRiskScore / 2)
    const roundScore = Math.max(0, stockoutScore + satisfactionScore + costScore - riskScorePenalty)

    return {
      storeResults,
      summary: {
        totalCost,
        avgStockoutRate: parseFloat(avgStockoutRate.toFixed(4)),
        avgSatisfaction: parseFloat(avgSatisfaction.toFixed(4)),
        totalRiskScore,
        stockoutScore,
        satisfactionScore,
        costScore,
        riskScorePenalty,
        roundScore
      }
    }
  }

  function calculateCycleSummary(roundResults) {
    if (!roundResults || roundResults.length === 0) {
      return null
    }

    const totalScore = roundResults.reduce((sum, r) => sum + r.summary.roundScore, 0)
    const avgStockoutRate = roundResults.reduce((sum, r) => sum + r.summary.avgStockoutRate, 0) / roundResults.length
    const avgSatisfaction = roundResults.reduce((sum, r) => sum + r.summary.avgSatisfaction, 0) / roundResults.length
    const totalCost = roundResults.reduce((sum, r) => sum + r.summary.totalCost, 0)
    const totalRisk = roundResults.reduce((sum, r) => sum + r.summary.totalRiskScore, 0)

    const strategyPoints = Math.round(avgSatisfaction * 50 + (1 - avgStockoutRate) * 30 + totalScore / 100)

    return {
      totalScore,
      avgStockoutRate: parseFloat(avgStockoutRate.toFixed(4)),
      avgSatisfaction: parseFloat(avgSatisfaction.toFixed(4)),
      totalCost,
      totalRisk,
      strategyPoints,
      grade: calculateGrade(totalScore, avgSatisfaction, avgStockoutRate)
    }
  }

  function calculateGrade(totalScore, avgSatisfaction, avgStockoutRate) {
    if (totalScore >= 8000 && avgSatisfaction >= 0.8 && avgStockoutRate <= 0.08) return 'S'
    if (totalScore >= 6500 && avgSatisfaction >= 0.7 && avgStockoutRate <= 0.12) return 'A'
    if (totalScore >= 5000 && avgSatisfaction >= 0.6 && avgStockoutRate <= 0.18) return 'B'
    if (totalScore >= 3500 && avgSatisfaction >= 0.5) return 'C'
    return 'D'
  }

  return {
    calculateStockoutRate,
    calculateSatisfaction,
    calculateCost,
    calculateRiskScore,
    calculateStoreResult,
    calculateRoundResult,
    calculateCycleSummary,
    calculateGrade
  }
}
