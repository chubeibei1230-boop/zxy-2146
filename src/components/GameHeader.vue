<template>
  <div class="game-header">
    <div class="header-left">
      <button class="btn btn-outline btn-sm" @click="$emit('backToMenu')">
        ← 主菜单
      </button>
      <div class="score-display">
        <span class="score-label">累计得分</span>
        <span class="score-num">{{ totalScore }}</span>
      </div>
      <div v-if="averageSatisfaction > 0" class="score-display mini">
        <span class="score-label">平均满意度</span>
        <span class="score-num">{{ (averageSatisfaction * 100).toFixed(1) }}%</span>
      </div>
    </div>
    <div class="header-center">
      <div class="role-switcher">
        <button
          class="role-btn"
          :class="{ active: role === 'planner' }"
          @click="$emit('setRole', 'planner')"
        >
          📋 分配员
        </button>
        <button
          class="role-btn"
          :class="{ active: role === 'hint' }"
          @click="$emit('setRole', 'hint')"
        >
          🔔 提示员
        </button>
        <button
          class="role-btn"
          :class="{ active: role === 'reviewer' }"
          :disabled="phase !== 'settlement'"
          @click="$emit('setRole', 'reviewer')"
        >
          📝 复盘员
        </button>
      </div>
    </div>
    <div class="header-right">
      <div class="round-progress">
        <div class="round-info">
          回合进度
          <strong>{{ currentRound }} / {{ totalRounds }}</strong>
        </div>
        <div class="progress-bar round-bar">
          <div
            class="progress-fill"
            style="background: linear-gradient(90deg, #4f46e5, #7c3aed)"
            :style="{ width: (currentRound / totalRounds * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalScore: {
    type: Number,
    required: true
  },
  averageSatisfaction: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    required: true
  },
  currentRound: {
    type: Number,
    required: true
  },
  totalRounds: {
    type: Number,
    required: true
  }
})

defineEmits(['backToMenu', 'setRole'])
</script>

<style scoped>
.game-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  gap: 16px;
  flex-wrap: wrap;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.score-display.mini .score-num {
  font-size: 16px;
  color: #059669;
}

.score-label {
  font-size: 10px;
  color: var(--text-secondary);
}

.score-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary-color);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.role-switcher {
  display: inline-flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
}

.role-btn {
  padding: 8px 18px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.role-btn:hover:not(:disabled) {
  color: var(--text-primary);
}

.role-btn.active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.role-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.round-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.round-info {
  font-size: 12px;
  color: var(--text-secondary);
}

.round-info strong {
  color: var(--text-primary);
  font-size: 14px;
  margin-left: 4px;
}

.round-bar {
  height: 6px;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}
</style>
