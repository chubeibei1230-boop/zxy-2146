const STORE_NAMES = [
  '中心旗舰店', '城东社区店', '城西便利站', '南城生活广场', '北城优品店',
  '科技园分店', '大学城店', '商业步行街店', '居民区服务店', '地铁站店',
  '机场航站楼店', '购物中心店', '工业园店', '医院旁分店', '公园门口店'
]

const STORE_TYPES = ['便利店', '超市', '生鲜店', '精品店', '社区店']

const RISK_EVENTS = [
  { id: 'high_demand', name: '突发高需求', description: '周边举办活动，客流量激增50%', demandMultiplier: 1.5, riskLevel: 2 },
  { id: 'supply_delay', name: '配送延迟', description: '物流出现问题，配送效率下降30%', deliveryPenalty: 0.3, riskLevel: 2 },
  { id: 'staff_leave', name: '员工请假潮', description: '多名员工请假，人手效率下降40%', staffPenalty: 0.4, riskLevel: 2 },
  { id: 'shelf_damage', name: '货架损坏', description: '部分货架损坏，陈列效果下降35%', displayPenalty: 0.35, riskLevel: 1 },
  { id: 'competitor_promo', name: '竞争对手促销', description: '附近门店大促，顾客流失风险增加', satisfactionPenalty: 0.15, riskLevel: 1 },
  { id: 'weather_issue', name: '恶劣天气', description: '暴雨/大雪影响客流和配送', demandMultiplier: 0.8, deliveryPenalty: 0.2, riskLevel: 1 },
  { id: 'holiday_rush', name: '节假日高峰', description: '假期来临，需求和标准双重提升', demandMultiplier: 1.3, satisfactionThreshold: 1.1, riskLevel: 3 },
  { id: 'inspection', name: '突击检查', description: '监管部门检查，陈列和库存标准提高', displayThreshold: 1.2, stockThreshold: 1.1, riskLevel: 2 },
  { id: 'new_product', name: '新品上架', description: '新品推出，需要更多陈列和人手', displayMultiplier: 1.3, staffMultiplier: 1.1, riskLevel: 1 },
  { id: 'system_failure', name: '系统故障', description: '库存系统故障，需更多人手人工盘点', staffMultiplier: 1.4, riskLevel: 2 }
]

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
    return {
      stock: { name: '库存量', icon: '📦', description: '商品库存数量，直接影响缺货率', costPerPoint: 1 },
      staff: { name: '人手数量', icon: '👥', description: '门店员工数，影响服务质量和效率', costPerPoint: 1 },
      delivery: { name: '配送次数', icon: '🚚', description: '补货配送频次，影响库存周转', costPerPoint: 1 },
      display: { name: '陈列维护', icon: '✨', description: '货架陈列维护，影响顾客体验', costPerPoint: 1 }
    }
  }

  return {
    calculateBaseResources,
    getResourceInfo
  }
}

export { STORE_NAMES, STORE_TYPES, RISK_EVENTS }
