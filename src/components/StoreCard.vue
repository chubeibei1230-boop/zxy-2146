<template>
  <div class="store-card card" :class="{ 'has-risk': store.riskEvent }">
    <div class="store-header">
      <div class="store-title">
        <span class="store-type">{{ store.type }}</span>
        <h4 class="store-name">{{ store.name }}</h4>
      </div>
      <div class="risk-indicators">
        <span
          class="risk-level"
          :class="getRiskLevelClass(store.riskLevel)"
        >
          ⚠️ {{ getRiskLevelText(store.riskLevel) }}
        </span>
      </div>
    </div>

    <div v-if="store.riskEvent" class="risk-event warning">
      <span class="risk-title">🔥 {{ store.riskEvent.name }}</span>
      <p class="risk-desc">{{ store.riskEvent.description }}</p>
    </div>

    <div class="store-metrics">
      <div class="metric">
        <span class="metric-label">📦 需求</span>
        <span class="metric-value">{{ store.demand }}</span>
      </div>
      <div class="metric" v-if="showResults">
        <span class="metric-label">📉 缺货率</span>
        <span class="metric-value" :class="getStockoutClass(store.currentStockoutRate)">
          {{ (store.currentStockoutRate * 100).toFixed(1) }}%
        </span>
      </div>
      <div class="metric" v-if="showResults">
        <span class="metric-label">😊 满意度</span>
        <span class="metric-value" :class="getSatisfactionClass(store.currentSatisfaction)">
          {{ (store.currentSatisfaction * 100).toFixed(1) }}%
        </span>
      </div>
      <div class="metric" v-if="showResults">
        <span class="metric-label">🎯 风险分</span>
        <span class="metric-value" :class="getRiskScoreClass(store.currentRiskScore)">
          {{ store.currentRiskScore }}
        </span>
      </div>
    </div>

    <div class="allocation-section">
      <div
        v-for="(info, key) in resourceInfo"
        :key="key"
        class="allocation-row"
      >
        <div class="allocation-label">
          <span>{{ info.icon }} {{ info.name }}</span>
          <div class="allocation-controls" v-if="!readOnly">
            <button
              class="ctrl-btn minus"
              @click="$emit('adjust', store.id, key, -1)"
              :disabled="store.allocatedResources[key] <= 0"
            >−</button>
            <input
              type="number"
              :value="store.allocatedResources[key]"
              @change="handleInputChange(key, $event)"
              min="0"
            />
            <button
              class="ctrl-btn plus"
              @click="$emit('adjust', store.id, key, 1)"
            >+</button>
          </div>
          <span v-else class="allocated-value">{{ store.allocatedResources[key] }}</span>
        </div>
        <input
          v-if="!readOnly"
          type="range"
          :value="store.allocatedResources[key]"
          @input="handleSliderChange(key, $event)"
          :max="getMaxSlider(key)"
          min="0"
          class="allocation-slider"
        />
        <div v-if="!readOnly" class="slider-info">
          <span>需求预估: {{ getEstimatedNeed(key) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  store: {
    type: Object,
    required: true
  },
  resourceInfo: {
    type: Object,
    required: true
  },
  resourcePoolRemaining: {
    type: Object,
    default: () => ({})
  },
  showResults: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['allocate', 'adjust'])

function getRiskLevelClass(level) {
  if (level >= 4) return 'danger'
  if (level >= 3) return 'warning'
  return 'success'
}

function getRiskLevelText(level) {
  const texts = ['', '低风险', '中风险', '高风险', '很高', '极高']
  return texts[Math.min(level, 5)] || '中风险'
}

function getStockoutClass(rate) {
  if (rate <= 0.05) return 'success'
  if (rate <= 0.15) return 'warning'
  return 'danger'
}

function getSatisfactionClass(sat) {
  if (sat >= 0.75) return 'success'
  if (sat >= 0.55) return 'warning'
  return 'danger'
}

function getRiskScoreClass(score) {
  if (score <= 30) return 'success'
  if (score <= 60) return 'warning'
  return 'danger'
}

function getMaxSlider(key) {
  const allocated = props.store.allocatedResources[key] || 0
  const remaining = props.resourcePoolRemaining[key] || 0
  return Math.max(0, allocated + remaining + 20)
}

function getEstimatedNeed(key) {
  const demand = props.store.demand
  const sizeMul = props.store.sizeMultiplier || 1
  switch (key) {
    case 'stock': return Math.round(demand * 0.9 * sizeMul)
    case 'staff': return Math.round(6 * sizeMul)
    case 'delivery': return Math.round(4 * sizeMul)
    case 'display': return Math.round(8 * sizeMul)
    default: return '-'
  }
}

function handleInputChange(key, event) {
  const value = parseInt(event.target.value) || 0
  emit('allocate', props.store.id, key, Math.max(0, value))
}

function handleSliderChange(key, event) {
  const value = parseInt(event.target.value) || 0
  emit('allocate', props.store.id, key, value)
}
</script>

<style scoped>
.store-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.store-card.has-risk {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.store-type {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  margin-bottom: 4px;
}

.store-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.risk-level {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.risk-level.success {
  background: #d1fae5;
  color: #065f46;
}

.risk-level.warning {
  background: #fef3c7;
  color: #92400e;
}

.risk-level.danger {
  background: #fee2e2;
  color: #991b1b;
}

.risk-event {
  padding: 12px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
}

.risk-title {
  font-weight: 700;
  color: #92400e;
  display: block;
  margin-bottom: 4px;
}

.risk-desc {
  font-size: 13px;
  color: #78350f;
  margin: 0;
}

.store-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-value.success {
  color: #059669;
}

.metric-value.warning {
  color: #d97706;
}

.metric-value.danger {
  color: #dc2626;
}

.allocation-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.allocation-row {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.allocation-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 13px;
}

.allocation-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn.minus {
  background: #fee2e2;
  color: #dc2626;
}

.ctrl-btn.minus:hover:not(:disabled) {
  background: #fecaca;
}

.ctrl-btn.plus {
  background: #d1fae5;
  color: #059669;
}

.ctrl-btn.plus:hover:not(:disabled) {
  background: #a7f3d0;
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.allocated-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
}

.slider-info {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  text-align: right;
}

.allocation-slider {
  margin: 4px 0;
}
</style>
