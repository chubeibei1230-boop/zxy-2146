import {
  STORE_NAMES,
  STORE_TYPES,
  RISK_EVENTS,
  RESOURCE_INFO
} from '../config/constants.js'

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function createStoreFactory() {
  let storeIdCounter = 0

  function generateStore(cycle = 1, difficultyMultiplier = 1) {
    const baseDemand = randomInt(20, 60) * difficultyMultiplier
    const store = {
      id: `store_${++storeIdCounter}`,
      name: pickRandom(STORE_NAMES) + (storeIdCounter > STORE_NAMES.length ? `(${storeIdCounter})` : ''),
      type: pickRandom(STORE_TYPES),
      baseDemand: Math.round(baseDemand),
      demand: Math.round(baseDemand * randomFloat(0.8, 1.2)),
      riskLevel: randomInt(1, 3),
      satisfactionBase: randomFloat(0.6, 0.85),
      sizeMultiplier: randomFloat(0.8, 1.2),
      currentSatisfaction: 0,
      currentStockoutRate: 0,
      currentRiskScore: 0,
      allocatedResources: {
        stock: 0,
        staff: 0,
        delivery: 0,
        display: 0
      },
      riskEvent: null
    }
    return store
  }

  function generateStores(count, cycle = 1, difficultyMultiplier = 1) {
    const stores = []
    for (let i = 0; i < count; i++) {
      stores.push(generateStore(cycle, difficultyMultiplier))
    }
    return stores
  }

  function refreshStoreDemand(store, cycle = 1) {
    const volatility = 0.1 + cycle * 0.02
    const change = randomFloat(1 - volatility, 1 + volatility)
    store.demand = Math.max(10, Math.round(store.baseDemand * change))
    store.riskLevel = Math.min(5, Math.max(1, store.riskLevel + randomInt(-1, 1)))
    store.allocatedResources = { stock: 0, staff: 0, delivery: 0, display: 0 }
    store.riskEvent = null
    return store
  }

  return {
    generateStore,
    generateStores,
    refreshStoreDemand
  }
}

export function createRiskEventFactory() {
  function generateRiskEvent(riskLevel = 1, cycle = 1) {
    const eligibleEvents = RISK_EVENTS.filter(e => e.riskLevel <= riskLevel + 1)
    if (eligibleEvents.length === 0) return null

    const eventChance = 0.2 + cycle * 0.03 + riskLevel * 0.1
    if (Math.random() > eventChance) return null

    const event = { ...pickRandom(eligibleEvents) }
    return event
  }

  function applyRiskEventToStore(store, event) {
    if (!event) return store
    store.riskEvent = event
    return store
  }

  function generateRoundRisks(stores, cycle = 1) {
    return stores.map(store => {
      const event = generateRiskEvent(store.riskLevel, cycle)
      return applyRiskEventToStore(store, event)
    })
  }

  function getAllRiskEvents() {
    return [...RISK_EVENTS]
  }

  return {
    generateRiskEvent,
    applyRiskEventToStore,
    generateRoundRisks,
    getAllRiskEvents
  }
}

export function createResourcePoolFactory() {
  function calculateBaseResources(cycle = 1, storeCount = 4, strategyBonus = 0) {
    const base = {
      stock: Math.round(80 + storeCount * 20 + cycle * 5 + strategyBonus * 0.4),
      staff: Math.round(20 + storeCount * 5 + cycle * 2 + strategyBonus * 0.15),
      delivery: Math.round(15 + storeCount * 3 + cycle * 1 + strategyBonus * 0.15),
      display: Math.round(25 + storeCount * 6 + cycle * 2 + strategyBonus * 0.3)
    }
    return base
  }

  function getResourceInfo() {
    return { ...RESOURCE_INFO }
  }

  return {
    calculateBaseResources,
    getResourceInfo
  }
}


