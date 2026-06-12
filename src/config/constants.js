export const TOTAL_ROUNDS = 10

export const GAME_PHASES = {
  MENU: 'menu',
  PLANNING: 'planning',
  SETTLEMENT: 'settlement',
  CYCLE_COMPLETE: 'cycleComplete'
}

export const ROLE_TYPES = {
  PLANNER: 'planner',
  HINT: 'hint',
  REVIEWER: 'reviewer'
}

export const ROLE_CONFIG = {
  [ROLE_TYPES.PLANNER]: {
    name: '分配员',
    icon: '📋',
    description: '负责将有限的资源分配到各个门店的不同维度，制定补货策略'
  },
  [ROLE_TYPES.HINT]: {
    name: '提示员',
    icon: '🔔',
    description: '展示各门店的风险等级和突发事件，提醒注意事项'
  },
  [ROLE_TYPES.REVIEWER]: {
    name: '复盘员',
    icon: '📝',
    description: '在结算阶段查看详细的得分报告和经营数据，分析得失'
  }
}

export const DIFFICULTY_MULTIPLIERS = {
  normal: 1.0,
  hard: 1.3,
  extreme: 1.6
}

export const RESOURCE_TYPES = {
  stock: 'stock',
  staff: 'staff',
  delivery: 'delivery',
  display: 'display'
}

export const RESOURCE_INFO = {
  [RESOURCE_TYPES.stock]: {
    name: '库存量',
    icon: '📦',
    description: '商品库存数量，直接影响缺货率',
    costPerPoint: 1
  },
  [RESOURCE_TYPES.staff]: {
    name: '人手数量',
    icon: '👥',
    description: '门店员工数，影响服务质量和效率',
    costPerPoint: 1
  },
  [RESOURCE_TYPES.delivery]: {
    name: '配送次数',
    icon: '🚚',
    description: '补货配送频次，影响库存周转',
    costPerPoint: 1
  },
  [RESOURCE_TYPES.display]: {
    name: '陈列维护',
    icon: '✨',
    description: '货架陈列维护，影响顾客体验',
    costPerPoint: 1
  }
}

export const RESOURCE_NAME_MAP = {
  stock: '库存量',
  staff: '人手数量',
  delivery: '配送次数',
  display: '陈列维护'
}

export const STORE_NAMES = [
  '中心旗舰店', '城东社区店', '城西便利站', '南城生活广场', '北城优品店',
  '科技园分店', '大学城店', '商业步行街店', '居民区服务店', '地铁站店',
  '机场航站楼店', '购物中心店', '工业园店', '医院旁分店', '公园门口店'
]

export const STORE_TYPES = ['便利店', '超市', '生鲜店', '精品店', '社区店']

export const RISK_LEVELS = ['低', '中', '高', '很高', '极高']

export const RISK_EVENTS = [
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

export const HINT_TEXTS = {
  plannerDefault: '各项指标正常，可根据各门店的需求预估来优化分配',
  highRiskLevel: '风险等级较高，建议增加资源投入',
  remainingResource: '还有较多剩余，请充分利用'
}

export const CONFIRM_DIALOG = {
  backToMenu: {
    title: '⚠️ 确认返回主菜单？',
    message: '当前游戏进度已自动保存到本地，你可以稍后通过「继续游戏」继续游玩。',
    confirmText: '确认返回',
    cancelText: '取消'
  }
}

export const GRADE_CRITERIA = [
  { grade: 'S', minScore: 8000, minSatisfaction: 0.8, maxStockoutRate: 0.08 },
  { grade: 'A', minScore: 6500, minSatisfaction: 0.7, maxStockoutRate: 0.12 },
  { grade: 'B', minScore: 5000, minSatisfaction: 0.6, maxStockoutRate: 0.18 },
  { grade: 'C', minScore: 3500, minSatisfaction: 0.5, maxStockoutRate: 1 },
  { grade: 'D', minScore: 0, minSatisfaction: 0, maxStockoutRate: 1 }
]

export const GRADE_RANK = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2 }

export const DEFAULT_SETTINGS = {
  storeCount: 4,
  difficulty: 'normal'
}

export const SAVE_KEYS = {
  game: 'store_restock_game_save_v1',
  unlocks: 'store_restock_game_unlocks_v1'
}

export const REGION_OBJECTIVE_TYPES = {
  HIGH_RISK_STABILITY: 'high_risk_stability',
  COST_CONTROL: 'cost_control',
  CUSTOMER_SATISFACTION: 'customer_satisfaction',
  REDUCE_STOCKOUT: 'reduce_stockout',
  OVERALL_BALANCE: 'overall_balance'
}

export const REGION_OBJECTIVES = {
  [REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY]: {
    id: REGION_OBJECTIVE_TYPES.HIGH_RISK_STABILITY,
    name: '保障高风险门店稳定',
    icon: '🛡️',
    description: '重点关注高风险等级门店，确保其风险评分不超过阈值',
    shortDesc: '控制高风险门店的风险评分',
    guidance: '优先向风险等级 ≥ 3 的门店投入资源，降低其风险评分',
    metric: '高风险门店平均风险分',
    targetValueByDifficulty: { normal: 55, hard: 60, extreme: 70 }
  },
  [REGION_OBJECTIVE_TYPES.COST_CONTROL]: {
    id: REGION_OBJECTIVE_TYPES.COST_CONTROL,
    name: '控制整体运营成本',
    icon: '💰',
    description: '合理分配资源，将全部门店的平均运营成本控制在目标范围内',
    shortDesc: '控制单店平均运营成本',
    guidance: '避免资源过度投入，优先保证核心需求，减少冗余分配',
    metric: '单店平均运营成本',
    targetValueByDifficulty: { normal: 520, hard: 460, extreme: 400 }
  },
  [REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION]: {
    id: REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION,
    name: '提升顾客满意度',
    icon: '😊',
    description: '提升全部门店的顾客满意度，达到目标水平',
    shortDesc: '区域平均顾客满意度',
    guidance: '增加人手和陈列维护投入，同时保证库存充足以降低缺货',
    metric: '区域平均满意度',
    targetValueByDifficulty: { normal: 0.68, hard: 0.72, extreme: 0.78 }
  },
  [REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT]: {
    id: REGION_OBJECTIVE_TYPES.REDUCE_STOCKOUT,
    name: '降低缺货率',
    icon: '📦',
    description: '优化库存与配送分配，将整体缺货率控制在较低水平',
    shortDesc: '区域平均缺货率',
    guidance: '优先保证库存量和配送次数，需求高的门店重点分配',
    metric: '区域平均缺货率',
    targetValueByDifficulty: { normal: 0.10, hard: 0.08, extreme: 0.05 }
  },
  [REGION_OBJECTIVE_TYPES.OVERALL_BALANCE]: {
    id: REGION_OBJECTIVE_TYPES.OVERALL_BALANCE,
    name: '区域综合平衡发展',
    icon: '⚖️',
    description: '在成本、满意度、缺货率、风险四个维度取得综合平衡',
    shortDesc: '综合经营指标评分',
    guidance: '避免某一维度过度倾斜，均衡分配各类资源到各门店',
    metric: '综合平衡得分',
    targetValueByDifficulty: { normal: 75, hard: 80, extreme: 85 }
  }
}

export const OBJECTIVE_COMPLETION_TIERS = [
  { tier: 'S', label: '卓越达成', minRatio: 1.2, bonusSP: 40, scoreMultiplier: 1.15 },
  { tier: 'A', label: '超额完成', minRatio: 1.0, bonusSP: 25, scoreMultiplier: 1.08 },
  { tier: 'B', label: '基本达成', minRatio: 0.8, bonusSP: 12, scoreMultiplier: 1.0 },
  { tier: 'C', label: '部分达成', minRatio: 0.5, bonusSP: 5, scoreMultiplier: 0.97 },
  { tier: 'D', label: '未达成', minRatio: 0, bonusSP: 0, scoreMultiplier: 0.9 }
]
