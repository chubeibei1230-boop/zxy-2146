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

    <div v-if="summary.objectiveSummary" class="objective-cycle-section">
      <div class="obj-cycle-header">
        <div class="obj-icon-lg">
          <span class="obj-icon-inner">{{ summary.objectiveSummary.icon }}</span>
          <div>
            <h3 class="obj-title-lg">{{ summary.objectiveSummary.name }}</h3>
            <div class="obj-desc-sm">{{ summary.objectiveSummary.description }}</div>
          </div>
        </div>
        <div class="obj-final-tier">
          <div class="tier-circle" :class="'tier-circle-' + summary.objectiveSummary.finalTier">
            <span class="tier-circle-label">周期评级</span>
            <span class="tier-circle-value">{{ summary.objectiveSummary.finalTier }}</span>
          </div>
          <div class="tier-circle-sub">{{ summary.objectiveSummary.finalTierLabel }}</div>
        </div>
      </div>

      <div class="obj-cycle-stats">
        <div class="obj-stat">
          <div class="obj-stat-label">平均完成度</div>
          <div class="obj-stat-value big">{{ (summary.objectiveSummary.avgCompletionRatio * 100).toFixed(0) }}%</div>
        </div>
        <div class="obj-stat highlight-stat">
          <div class="obj-stat-label">目标奖励策略点</div>
          <div class="obj-stat-value strategy-text">💎 +{{ summary.objectiveBonusSP || summary.objectiveSummary.totalBonusSP }}</div>
        </div>
        <div class="obj-stat">
          <div class="obj-stat-label">平均得分倍率</div>
          <div class="obj-stat-value">×{{ summary.objectiveScoreMultiplier ? summary.objectiveScoreMultiplier.toFixed(2) : summary.objectiveSummary.avgScoreMultiplier.toFixed(2) }}</div>
        </div>
      </div>

      <div class="obj-cycle-metric-row">
        <div class="obj-stat-label-row">
          <span>{{ summary.objectiveSummary.metric }}</span>
          <span>目标 {{ formatTarget(summary.objectiveSummary) }}</span>
        </div>
        <div class="obj-tier-breakdown">
          <div
            v-for="(tierInfo, index) in sortedTierList"
            :key="tierInfo.tier"
            class="tier-breakdown-item"
          >
            <span class="tier-badge-mini" :class="'tier-mini-' + tierInfo.tier">{{ tierInfo.tier }}</span>
            <span class="tier-count">{{ summary.objectiveSummary.tierBreakdown[tierInfo.tier] || 0 }} 回合</span>
          </div>
        </div>
      </div>
    </div>

    <div class="overall-score-section">
      <div class="big-score">
        <span class="big-score-label">总得分</span>
        <span class="big-score-value">{{ summary.totalScore }}</span>
        <div v-if="summary.objectiveScoreMultiplier && summary.objectiveScoreMultiplier !== 1.0" class="big-score-sub">
          含目标加成 ×{{ summary.objectiveScoreMultiplier.toFixed(2) }}
        </div>
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
            <span v-if="summary.objectiveBonusSP > 0" class="stat-sub">
              含目标奖励 +{{ summary.objectiveBonusSP }}</span>
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
              策略点 = 满意度×50 + 供货能力×30 + 总分/100 + 目标奖励 {{ summary.objectiveBonusSP || 0 }} = {{ summary.strategyPoints }}
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
import { createRegionObjectiveEngine } from '../utils/regionObjective.js'
import { OBJECTIVE_COMPLETION_TIERS } from '../config/constants.js'

const engine = createRegionObjectiveEngine()

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

const sortedTierList = OBJECTIVE_COMPLETION_TIERS.map(t => ({ tier: t.tier, label: t.label }))

function formatTarget(summaryObj) {
  return engine.formatTargetValue(summaryObj.type, summaryObj.targetValue)
}

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
  max-width: 780px;
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

.objective-cycle-section {
  margin: 24px 0 30px;
  padding: 24px;
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #ecfdf5 100%);
  border: 3px solid #fbbf24;
  border-radius: 18px;
  text-align: left;
}

.obj-cycle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.obj-icon-lg {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.obj-icon-inner {
  font-size: 48px;
  line-height: 1;
}

.obj-title-lg {
  font-size: 20px;
  font-weight: 700;
  color: #78350f;
  margin: 0 0 4px;
}

.obj-desc-sm {
  font-size: 13px;
  color: #92400e;
  opacity: 0.9;
}

.obj-final-tier {
  text-align: center;
}

.tier-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.tier-circle-S { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.tier-circle-A { background: linear-gradient(135deg, #10b981, #059669); }
.tier-circle-B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.tier-circle-C { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.tier-circle-D { background: linear-gradient(135deg, #64748b, #475569); }

.tier-circle-label {
  font-size: 11px;
  opacity: 0.95;
}

.tier-circle-value {
  font-size: 40px;
  font-weight: 900;
  line-height: 1;
}

.tier-circle-sub {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #78350f;
}

.obj-cycle-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.obj-stat {
  padding: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  text-align: center;
}

.obj-stat.highlight-stat {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.18), rgba(16, 185, 129, 0.12));
  border-color: rgba(251, 191, 36, 0.5);
}

.obj-stat-label {
  font-size: 12px;
  color: #92400e;
  margin-bottom: 4px;
  opacity: 0.9;
}

.obj-stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #78350f;
}

.obj-stat-value.big {
  font-size: 28px;
  color: #065f46;
}

.obj-stat-value.strategy-text {
  color: #b45309;
  font-size: 24px;
}

.obj-cycle-metric-row {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.obj-stat-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #78350f;
  margin-bottom: 10px;
}

.obj-tier-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tier-breakdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: white;
  border-radius: 20px;
}

.tier-badge-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 800;
}

.tier-mini-S { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.tier-mini-A { background: linear-gradient(135deg, #10b981, #059669); }
.tier-mini-B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.tier-mini-C { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.tier-mini-D { background: linear-gradient(135deg, #64748b, #475569); }

.tier-count {
  font-size: 12px;
  color: #78350f;
  font-weight: 600;
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

.big-score-sub {
  font-size: 12px;
  color: #4f46e5;
  margin-top: 4px;
  background: rgba(79, 70, 229, 0.1);
  padding: 2px 10px;
  border-radius: 10px;
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
  flex: 1;
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

.stat-sub {
  font-size: 11px;
  color: #92400e;
  margin-top: 2px;
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
