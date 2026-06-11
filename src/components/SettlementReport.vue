<template>
  <div class="settlement-report card">
    <div class="report-header">
      <h3>📋 回合 {{ round }} 结算报告</h3>
      <div class="total-score-badge">
        <span class="score-label">本回合得分</span>
        <span class="score-value">{{ result.summary.roundScore }}</span>
      </div>
    </div>

    <div class="score-breakdown">
      <div class="score-item success">
        <div class="score-icon">📦</div>
        <div class="score-details">
          <span class="score-name">缺货率得分</span>
          <span class="score-number">+{{ result.summary.stockoutScore }}</span>
        </div>
        <div class="score-bar success" :style="{ width: Math.min(100, result.summary.stockoutScore / 4) + '%' }"></div>
      </div>
      <div class="score-item info">
        <div class="score-icon">😊</div>
        <div class="score-details">
          <span class="score-name">满意度得分</span>
          <span class="score-number">+{{ result.summary.satisfactionScore }}</span>
        </div>
        <div class="score-bar info" :style="{ width: Math.min(100, result.summary.satisfactionScore / 3) + '%' }"></div>
      </div>
      <div class="score-item warning">
        <div class="score-icon">💰</div>
        <div class="score-details">
          <span class="score-name">成本控制得分</span>
          <span class="score-number">+{{ result.summary.costScore }}</span>
        </div>
        <div class="score-bar warning" :style="{ width: Math.min(100, result.summary.costScore / 5) + '%' }"></div>
      </div>
      <div class="score-item danger">
        <div class="score-icon">⚠️</div>
        <div class="score-details">
          <span class="score-name">风险扣分</span>
          <span class="score-number">-{{ result.summary.riskScorePenalty }}</span>
        </div>
        <div class="score-bar danger" :style="{ width: Math.min(100, result.summary.riskScorePenalty / 5) + '%' }"></div>
      </div>
    </div>

    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-label">平均缺货率</div>
        <div class="stat-value" :class="getStockoutClass(result.summary.avgStockoutRate)">
          {{ (result.summary.avgStockoutRate * 100).toFixed(1) }}%
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: Math.min(100, result.summary.avgStockoutRate * 300) + '%',
              background: getStockoutColor(result.summary.avgStockoutRate)
            }"
          ></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均满意度</div>
        <div class="stat-value" :class="getSatisfactionClass(result.summary.avgSatisfaction)">
          {{ (result.summary.avgSatisfaction * 100).toFixed(1) }}%
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: (result.summary.avgSatisfaction * 100) + '%',
              background: getSatisfactionColor(result.summary.avgSatisfaction)
            }"
          ></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总成本</div>
        <div class="stat-value">¥{{ result.summary.totalCost }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">风险总分</div>
        <div class="stat-value" :class="getRiskScoreClass(result.summary.totalRiskScore)">
          {{ result.summary.totalRiskScore }}
        </div>
      </div>
    </div>

    <div class="store-details">
      <h4>🏪 各门店详情</h4>
      <div class="store-results-grid">
        <div
          v-for="sr in result.storeResults"
          :key="sr.storeId"
          class="store-result-card"
        >
          <div class="store-result-header">
            <span class="store-result-name">{{ sr.storeName }}</span>
            <span class="store-result-demand">需求: {{ sr.demand }}</span>
          </div>
          <div v-if="sr.riskEvent" class="store-result-event">
            🔥 {{ sr.riskEvent.name }}
          </div>
          <div class="store-result-metrics">
            <div class="mini-metric">
              <span class="mini-label">缺货</span>
              <span class="mini-value" :class="getStockoutClass(sr.stockoutRate)">
                {{ (sr.stockoutRate * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="mini-metric">
              <span class="mini-label">满意</span>
              <span class="mini-value" :class="getSatisfactionClass(sr.satisfaction)">
                {{ (sr.satisfaction * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="mini-metric">
              <span class="mini-label">成本</span>
              <span class="mini-value">¥{{ sr.cost }}</span>
            </div>
            <div class="mini-metric">
              <span class="mini-label">风险</span>
              <span class="mini-value" :class="getRiskScoreClass(sr.riskScore)">
                {{ sr.riskScore }}
              </span>
            </div>
          </div>
          <div class="store-result-allocations">
            <span class="alloc-tag" v-for="(val, key) in sr.allocatedResources" :key="key">
              {{ getResourceIcon(key) }} {{ val }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  result: {
    type: Object,
    required: true
  },
  round: {
    type: Number,
    default: 1
  }
})

function getStockoutClass(rate) {
  if (rate <= 0.05) return 'success'
  if (rate <= 0.15) return 'warning'
  return 'danger'
}

function getStockoutColor(rate) {
  if (rate <= 0.05) return '#10b981'
  if (rate <= 0.15) return '#f59e0b'
  return '#ef4444'
}

function getSatisfactionClass(sat) {
  if (sat >= 0.75) return 'success'
  if (sat >= 0.55) return 'warning'
  return 'danger'
}

function getSatisfactionColor(sat) {
  if (sat >= 0.75) return '#10b981'
  if (sat >= 0.55) return '#f59e0b'
  return '#ef4444'
}

function getRiskScoreClass(score) {
  if (score <= 30) return 'success'
  if (score <= 60) return 'warning'
  return 'danger'
}

function getResourceIcon(key) {
  const icons = { stock: '📦', staff: '👥', delivery: '🚚', display: '✨' }
  return icons[key] || '📌'
}
</script>

<style scoped>
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-color);
}

.report-header h3 {
  font-size: 20px;
}

.total-score-badge {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.score-label {
  display: block;
  font-size: 12px;
  opacity: 0.9;
}

.score-value {
  display: block;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
}

.score-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.score-item {
  position: relative;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.score-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  transition: width 0.5s ease;
}

.score-bar.success { background: #10b981; }
.score-bar.info { background: #3b82f6; }
.score-bar.warning { background: #f59e0b; }
.score-bar.danger { background: #ef4444; }

.score-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.score-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.score-number {
  font-size: 18px;
  font-weight: 700;
}

.score-item.success .score-number { color: #059669; }
.score-item.info .score-number { color: #2563eb; }
.score-item.warning .score-number { color: #d97706; }
.score-item.danger .score-number { color: #dc2626; }

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}

.stat-card {
  padding: 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-value.success { color: #059669; }
.stat-value.warning { color: #d97706; }
.stat-value.danger { color: #dc2626; }

.store-details h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.store-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.store-result-card {
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.store-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.store-result-name {
  font-weight: 600;
  font-size: 14px;
}

.store-result-demand {
  font-size: 11px;
  color: var(--text-secondary);
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
}

.store-result-event {
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.store-result-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.mini-metric {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 6px 8px;
  border-radius: 6px;
}

.mini-label {
  font-size: 10px;
  color: var(--text-secondary);
}

.mini-value {
  font-size: 14px;
  font-weight: 600;
}

.mini-value.success { color: #059669; }
.mini-value.warning { color: #d97706; }
.mini-value.danger { color: #dc2626; }

.store-result-allocations {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.alloc-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
}
</style>
