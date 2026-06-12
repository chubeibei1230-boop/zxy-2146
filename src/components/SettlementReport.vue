<template>
  <div class="settlement-report card">
    <div class="report-header">
      <h3>📋 回合 {{ round }} 结算报告</h3>
      <div class="total-score-badge">
        <span class="score-label">本回合得分</span>
        <span class="score-value">{{ result.summary.roundScore }}</span>
        <div v-if="result.summary.objectiveMultiplier && result.summary.objectiveMultiplier !== 1.0" class="score-adjust">
          基础 {{ result.summary.baseRoundScore }} × {{ result.summary.objectiveMultiplier.toFixed(2) }}
        </div>
        <div v-if="result.summary.objectiveBonusSP > 0" class="score-adjust score-sp">
          💎 目标奖励策略点 +{{ result.summary.objectiveBonusSP }}
        </div>
      </div>
    </div>

    <div v-if="objectiveResult" class="objective-report-section">
      <div class="objective-report-header">
        <div class="obj-title-wrap">
          <span class="obj-icon">{{ regionObjective?.icon || '🎯' }}</span>
          <div>
            <h4 class="obj-report-title">
              区域目标：{{ regionObjective?.name || '目标' }}
              <span class="tier-tag" :class="'tier-bg-' + objectiveResult.tier">
                {{ objectiveResult.tierLabel }}
              </span>
            </h4>
            <div class="obj-report-metric">
              {{ objectiveResult.metricLabel }}：
              <span class="actual">{{ formatActualValue(objectiveResult.actualValue) }}</span>
              / 目标 {{ formatTargetValue(objectiveResult.targetValue) }}
            </div>
          </div>
        </div>
        <div class="obj-completion">
          <div class="completion-percent" :class="'text-tier-' + objectiveResult.tier">
            {{ (objectiveResult.completionRatio * 100).toFixed(0) }}%
          </div>
          <div class="completion-rewards">
            <span v-if="objectiveResult.bonusSP > 0" class="reward-sp">💎 +{{ objectiveResult.bonusSP }}</span>
            <span class="reward-mul">×{{ objectiveResult.scoreMultiplier.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="obj-progress-big">
        <div
          class="progress-fill big-fill"
          :class="'fill-' + objectiveResult.tier"
          :style="{ width: Math.min(100, objectiveResult.completionRatio * 100) + '%' }"
        ></div>
      </div>

      <div class="obj-factors-grid">
        <div v-if="objectiveResult.positiveFactors && objectiveResult.positiveFactors.length > 0" class="factors-col positive">
          <div class="factors-title">✅ 达成因素</div>
          <ul class="factors-list">
            <li v-for="(f, i) in objectiveResult.positiveFactors" :key="'p'+i">{{ f }}</li>
          </ul>
        </div>
        <div v-if="objectiveResult.negativeFactors && objectiveResult.negativeFactors.length > 0" class="factors-col negative">
          <div class="factors-title">⚠️ 问题因素</div>
          <ul class="factors-list">
            <li v-for="(f, i) in objectiveResult.negativeFactors" :key="'n'+i">{{ f }}</li>
          </ul>
        </div>
      </div>

      <div v-if="objectiveResult.suggestions && objectiveResult.suggestions.length > 0" class="obj-suggestions">
        <div class="suggest-title">💡 经营建议</div>
        <ul class="suggest-list">
          <li v-for="(s, i) in objectiveResult.suggestions" :key="'s'+i">{{ s }}</li>
        </ul>
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
import { createRegionObjectiveEngine } from '../utils/regionObjective.js'

const engine = createRegionObjectiveEngine()

const props = defineProps({
  result: {
    type: Object,
    required: true
  },
  round: {
    type: Number,
    default: 1
  },
  objectiveResult: {
    type: Object,
    default: null
  },
  regionObjective: {
    type: Object,
    default: null
  }
})

function formatActualValue(value) {
  if (!props.regionObjective) return value
  return engine.formatActualValue(props.regionObjective.type, value)
}

function formatTargetValue(value) {
  if (!props.regionObjective) return value
  return engine.formatTargetValue(props.regionObjective.type, value)
}

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
  flex-wrap: wrap;
  gap: 12px;
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

.score-adjust {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
}

.score-adjust.score-sp {
  background: rgba(251, 191, 36, 0.25);
  color: #fffbeb;
  font-weight: 700;
}

.objective-report-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #fffbeb, #f0fdf4);
  border: 2px solid #fbbf24;
  border-radius: 14px;
}

.objective-report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.obj-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.obj-icon {
  font-size: 36px;
  line-height: 1;
}

.obj-report-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #78350f;
  margin: 0 0 4px;
}

.tier-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.tier-bg-S { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tier-bg-A { background: linear-gradient(135deg, #10b981, #059669); }
.tier-bg-B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.tier-bg-C { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.tier-bg-D { background: linear-gradient(135deg, #64748b, #475569); }

.obj-report-metric {
  font-size: 13px;
  color: #78350f;
}

.obj-report-metric .actual {
  font-weight: 700;
  color: #065f46;
}

.obj-completion {
  text-align: right;
}

.completion-percent {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
}

.text-tier-S { color: #d97706; }
.text-tier-A { color: #059669; }
.text-tier-B { color: #2563eb; }
.text-tier-C { color: #7c3aed; }
.text-tier-D { color: #475569; }

.completion-rewards {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.reward-sp {
  background: rgba(245, 158, 11, 0.15);
  color: #92400e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.reward-mul {
  background: rgba(6, 95, 70, 0.1);
  color: #065f46;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.obj-progress-big {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin: 12px 0 18px;
}

.big-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.7s ease;
}

.fill-S { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.fill-A { background: linear-gradient(90deg, #059669, #10b981); }
.fill-B { background: linear-gradient(90deg, #2563eb, #3b82f6); }
.fill-C { background: linear-gradient(90deg, #7c3aed, #8b5cf6); }
.fill-D { background: linear-gradient(90deg, #475569, #64748b); }

.obj-factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.factors-col {
  padding: 12px;
  border-radius: 10px;
}

.factors-col.positive {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.factors-col.negative {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.factors-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.positive .factors-title { color: #065f46; }
.negative .factors-title { color: #991b1b; }

.factors-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
}

.positive .factors-list { color: #047857; }
.negative .factors-list { color: #b91c1c; }

.obj-suggestions {
  padding: 12px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px dashed rgba(59, 130, 246, 0.4);
  border-radius: 10px;
}

.suggest-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
}

.suggest-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: #1e3a8a;
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
