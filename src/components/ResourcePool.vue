<template>
  <div class="resource-pool card">
    <div class="header">
      <h3>📊 资源池</h3>
      <div class="cycle-info">
        <span class="badge badge-info">第 {{ cycle }} 周目</span>
        <span class="badge badge-success">回合 {{ round }}/{{ totalRounds }}</span>
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
  }
})

function getProgressColor(remaining, total) {
  const ratio = total > 0 ? remaining / total : 0
  if (ratio > 0.5) return '#10b981'
  if (ratio > 0.2) return '#f59e0b'
  return '#ef4444'
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
</style>
