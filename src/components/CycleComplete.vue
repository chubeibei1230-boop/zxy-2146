<template>
  <div class="cycle-complete card">
    <div class="celebration">
      <div class="trophy">🏆</div>
      <h2>周目完成！</h2>
      <div class="grade-display" :class="'grade-' + summary.grade">
        <span class="grade-label">评级</span>
        <span class="grade-value">{{ summary.grade }}</span>
      </div>
      <p class="cycle-subtitle">第 {{ cycle }} 周目结算</p>
    </div>

    <div class="overall-score-section">
      <div class="big-score">
        <span class="big-score-label">总得分</span>
        <span class="big-score-value">{{ summary.totalScore }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-icon">😊</div>
        <div class="stat-content">
          <span class="stat-title">平均满意度</span>
          <span class="stat-num" :class="getSatisfactionClass(summary.avgSatisfaction)">
            {{ (summary.avgSatisfaction * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">📉</div>
        <div class="stat-content">
          <span class="stat-title">平均缺货率</span>
          <span class="stat-num" :class="getStockoutClass(summary.avgStockoutRate)">
            {{ (summary.avgStockoutRate * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <span class="stat-title">累计成本</span>
          <span class="stat-num">¥{{ summary.totalCost }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <span class="stat-title">风险累计</span>
          <span class="stat-num" :class="getRiskClass(summary.totalRisk)">
            {{ summary.totalRisk }}
          </span>
        </div>
      </div>
      <div class="stat-item highlight">
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <span class="stat-title">获得策略点</span>
            <span class="stat-num strategy">{{ summary.strategyPoints }}</span>
          </div>
        </div>
      </div>

    <div class="inheritance-section">
      <h4>🔄 下一周目继承</h4>
      <div class="inheritance-rules">
        <div class="rule">
          <span class="rule-icon">📈</span>
          <div>
            <span class="rule-title">资源加成</span>
            <span class="rule-desc">
              将满意度 × 50 + 供货能力 × 30 + 总分 / 100 = {{ summary.strategyPoints }} 策略点
            </span>
          </div>
        </div>
        <div class="rule">
          <span class="rule-icon">🏪</span>
          <div>
            <span class="rule-title">可能解锁</span>
            <span class="rule-desc">
              {{ getUnlockedText() }}
            </span>
          </div>
        </div>
        <div class="rule">
          <span class="rule-icon">⚡</span>
          <div>
            <span class="rule-title">下周目加成</span>
            <span class="rule-desc">
              下周目初始资源将继承策略点的约 {{ Math.round(summary.strategyPoints * 0.6) }} 点
            </span>
          </div>
        </div>
      </div>
      </div>

    <div class="actions">
      <button class="btn btn-success" @click="$emit('nextCycle')">
        🚀 进入下一周目
      </button>
      <button class="btn btn-outline" @click="$emit('backToMenu')">
        🏠 返回主菜单
      </button>
    </div>
    </div>
</template>

<script setup>
const props = defineProps({
  summary: {
    type: Object,
    required: true
  },
  cycle: {
    type: Number,
    default: 1
  },
  unlocks: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['nextCycle', 'backToMenu'])

function getSatisfactionClass(sat) {
  if (sat >= 0.75) return 'success'
  if (sat >= 0.55) return 'warning'
  return 'danger'
}

function getStockoutClass(rate) {
  if (rate <= 0.05) return 'success'
  if (rate <= 0.15) return 'warning'
  return 'danger'
}

function getRiskClass(risk) {
  if (risk <= 300) return 'success'
  if (risk <= 600) return 'warning'
  return 'danger'
}

function getUnlockedText() {
  const features = []
  if (props.unlocks?.unlockedFeatures) {
    if (props.unlocks.unlockedFeatures.storeCount_5 && props.cycle === 1) features.push('5 家门店')
    if (props.unlocks.unlockedFeatures.storeCount_6 && props.cycle === 2) features.push('6 家门店')
    if (props.unlocks.unlockedFeatures.storeCount_7) features.push('7 家门店')
    if (props.unlocks.unlockedFeatures.storeCount_8) features.push('8 家门店')
    if (props.unlocks.unlockedFeatures.difficulty_hard) features.push('困难模式')
    if (props.unlocks.unlockedFeatures.difficulty_extreme) features.push('极限模式')
  }
  return features.length > 0 ? '已解锁：' + features.join('、') : '继续挑战解锁更多内容！'
}
</script>

<style scoped>
.cycle-complete {
  max-width: 700px;
  margin: 20px auto;
  padding: 40px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.celebration {
  margin-bottom: 30px;
}

.trophy {
  font-size: 80px;
  margin-bottom: 16px;
  animation: bounce 1s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.celebration h2 {
  font-size: 32px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.grade-display {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 20px;
  margin: 0 auto 12px;
  color: white;
}

.grade-S { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.grade-A { background: linear-gradient(135deg, #10b981, #059669); }
.grade-B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.grade-C { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.grade-D { background: linear-gradient(135deg, #64748b, #475569); }

.grade-label {
  font-size: 12px;
  opacity: 0.9;
}

.grade-value {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
}

.cycle-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.overall-score-section {
  margin: 30px 0;
  padding: 24px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: 16px;
}

.big-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.big-score-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.big-score-value {
  font-size: 56px;
  font-weight: 900;
  color: var(--primary-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.stat-item.highlight {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.stat-icon {
  font-size: 28px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-num.success { color: #059669; }
.stat-num.warning { color: #d97706; }
.stat-num.danger { color: #dc2626; }
.stat-num.strategy {
  color: #f59e0b;
  font-size: 26px;
}

.inheritance-section {
  text-align: left;
  margin-bottom: 30px;
  padding: 20px;
  background: #f1f5f9;
  border-radius: 12px;
}

.inheritance-section h4 {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.inheritance-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.rule-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.rule-title {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.rule-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.actions .btn {
  padding: 14px 28px;
  font-size: 16px;
}
</style>
