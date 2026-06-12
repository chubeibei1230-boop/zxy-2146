<template>
  <div class="resource-pool card">
    <div class="header">
      <h3>📊 资源池</h3>
      <div class="cycle-info">
        <span class="badge badge-info">第 {{ cycle }} 周目</span>
        <span class="badge badge-success">回合 {{ round }}/{{ totalRounds }}</span>
      </div>
    </div>

    <div class="objective-section" v-if="regionObjective && phase === 'planning'">
      <div class="objective-card">
        <div class="objective-header">
          <div class="objective-icon-name">
            <span class="objective-icon">{{ regionObjective.icon }}</span>
            <div>
              <div class="objective-title">
                <span class="obj-label">本周目区域目标</span>
                <span class="obj-name">{{ regionObjective.name }}</span>
              </div>
              <div class="objective-short-desc">{{ regionObjective.shortDesc }}</div>
            </div>
          </div>
          <div class="objective-target">
            <div class="target-metric">{{ regionObjective.metric }}</div>
            <div class="target-value" :class="getObjectiveValueClass(regionObjective.type)">
              {{ formatObjectiveTarget(regionObjective) }}
            </div>
          </div>
        </div>
        <div class="objective-description">
          📌 {{ regionObjective.description }}
        </div>
        <div class="objective-guidance">
          💡 <strong>分配引导：</strong>{{ regionObjective.guidance }}
        </div>
        <div class="objective-rounds mt-2">
          <span class="text-sm text-secondary">
            本目标将贯穿本周期全部 {{ totalRounds }} 回合，每周达成情况将累计影响最终评级与奖励
          </span>
        </div>
      </div>
    </div>

    <div class="objective-section" v-if="regionObjective && phase === 'settlement' && currentRoundObjectiveResult">
      <div class="objective-card">
        <div class="objective-header">
          <div class="objective-icon-name">
            <span class="objective-icon">{{ regionObjective.icon }}</span>
            <div>
              <div class="objective-title">
                <span class="obj-label">本周目区域目标</span>
                <span class="obj-name">{{ regionObjective.name }}</span>
              </div>
              <div class="tier-badge" :class="'tier-' + currentRoundObjectiveResult.tier">
                {{ currentRoundObjectiveResult.tierLabel }}
              </div>
            </div>
          </div>
          <div class="objective-target">
            <div class="target-metric">本回合完成情况</div>
            <div class="completion-ratio">{{ (currentRoundObjectiveResult.completionRatio * 100).toFixed(0) }}%</div>
          </div>
        </div>
        <div class="objective-round-progress">
          <div class="progress-label">
            <span>实际：{{ formatObjectiveActual(regionObjective.type, currentRoundObjectiveResult.actualValue) }}</span>
            <span>目标：{{ formatObjectiveTarget(regionObjective) }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill tier-fill"
              :class="'fill-' + currentRoundObjectiveResult.tier"
              :style="{ width: Math.min(100, currentRoundObjectiveResult.completionRatio * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="resources-grid">
      <div
        v-for="(info, key) in resourceInfo"
        :key="key"
        class="resource-item"
      >
        <div class="resource-header">
          <span class="resource-icon">{{ info.icon }}</span>
          <span class="resource-name">{{ info.name }}</span>
        </div>
        <div class="resource-values">
          <span class="remaining">{{ remaining[key] }}</span>
          <span class="separator">/</span>
          <span class="total">{{ total[key] }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: (total[key] > 0 ? (remaining[key] / total[key] * 100) : 0) + '%',
              background: getProgressColor(remaining[key], total[key])
            }"
          ></div>
        </div>
        <div class="resource-tip text-sm text-secondary">{{ info.description }}</div>
      </div>
    </div>

    <div class="strategy-points mt-4" v-if="strategyPoints > 0">
      <span class="badge badge-warning">💎 继承策略点: {{ strategyPoints }}</span>
    </div>
  </div>
</template>

<script setup>
import { createRegionObjectiveEngine } from '../utils/regionObjective.js'
import { REGION_OBJECTIVE_TYPES } from '../config/constants.js'

const engine = createRegionObjectiveEngine()

defineProps({
  resourceInfo: {
    type: Object,
    required: true
  },
  total: {
    type: Object,
    required: true
  },
  remaining: {
    type: Object,
    required: true
  },
  cycle: {
    type: Number,
    default: 1
  },
  round: {
    type: Number,
    default: 1
  },
  totalRounds: {
    type: Number,
    default: 10
  },
  strategyPoints: {
    type: Number,
    default: 0
  },
  regionObjective: {
    type: Object,
    default: null
  },
  phase: {
    type: String,
    default: 'planning'
  },
  currentRoundObjectiveResult: {
    type: Object,
    default: null
  }
})

function getProgressColor(remaining, total) {
  const ratio = total > 0 ? remaining / total : 0
  if (ratio > 0.5) return '#10b981'
  if (ratio > 0.2) return '#f59e0b'
  return '#ef4444'
}

function formatObjectiveTarget(objective) {
  if (!objective) return ''
  return engine.formatTargetValue(objective.type, objective.targetValue)
}

function formatObjectiveActual(type, value) {
  return engine.formatActualValue(type, value)
}

function getObjectiveValueClass(type) {
  switch (type) {
    case REGION_OBJECTIVE_TYPES.CUSTOMER_SATISFACTION:
    case REGION_OBJECTIVE_TYPES.OVERALL_BALANCE:
      return 'value-target-high'
    default:
      return 'value-target-low'
  }
}
</script>

<style scoped>
.resource-pool {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  font-size: 18px;
  color: var(--text-primary);
}

.cycle-info {
  display: flex;
  gap: 8px;
}

.objective-section {
  margin-bottom: 20px;
}

.objective-card {
  padding: 18px;
  background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 50%, #ecfdf5 100%);
  border: 2px solid #f59e0b;
  border-radius: 14px;
}

.objective-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.objective-icon-name {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.objective-icon {
  font-size: 40px;
  line-height: 1;
}

.objective-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.obj-label {
  font-size: 12px;
  color: #92400e;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.obj-name {
  font-size: 17px;
  font-weight: 700;
  color: #78350f;
}

.objective-short-desc {
  font-size: 13px;
  color: #78350f;
  opacity: 0.85;
  margin-top: 4px;
}

.tier-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.tier-S { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tier-A { background: linear-gradient(135deg, #10b981, #059669); }
.tier-B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.tier-C { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.tier-D { background: linear-gradient(135deg, #64748b, #475569); }

.objective-target {
  text-align: right;
  flex-shrink: 0;
}

.target-metric {
  font-size: 12px;
  color: #92400e;
  margin-bottom: 4px;
  font-weight: 500;
}

.target-value {
  font-size: 22px;
  font-weight: 800;
  color: #b45309;
}

.value-target-high { color: #047857; }
.value-target-low { color: #b45309; }

.completion-ratio {
  font-size: 28px;
  font-weight: 800;
  color: #065f46;
}

.objective-description {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-size: 13px;
  color: #78350f;
  margin-bottom: 8px;
}

.objective-guidance {
  padding: 10px 12px;
  background: rgba(6, 95, 70, 0.08);
  border-left: 4px solid #059669;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  color: #064e3b;
  line-height: 1.5;
}

.objective-round-progress {
  padding: 8px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #78350f;
  font-weight: 500;
  margin-bottom: 6px;
}

.tier-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.fill-S { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.fill-A { background: linear-gradient(90deg, #059669, #10b981); }
.fill-B { background: linear-gradient(90deg, #2563eb, #3b82f6); }
.fill-C { background: linear-gradient(90deg, #7c3aed, #8b5cf6); }
.fill-D { background: linear-gradient(90deg, #475569, #64748b); }

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.resource-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.resource-icon {
  font-size: 24px;
}

.resource-name {
  font-weight: 600;
  color: var(--text-primary);
}

.resource-values {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.remaining {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}

.separator {
  color: var(--text-secondary);
  font-size: 18px;
}

.total {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

.resource-tip {
  margin-top: 8px;
  font-size: 12px;
}

.strategy-points {
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.text-sm {
  font-size: 12px;
}

.text-secondary {
  color: var(--text-secondary);
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
