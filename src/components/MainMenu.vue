<template>
  <div class="main-menu">
    <div class="menu-hero">
      <div class="hero-content">
        <h1 class="game-title">🏪 门店补货分配大师</h1>
        <p class="game-subtitle">回合制资源分配策略游戏</p>
      </div>
    </div>

    <div class="menu-container">
      <div class="menu-card card">
        <h2 class="menu-title">开始游戏</h2>

        <div class="setting-group">
          <label class="setting-label">🏪 门店数量</label>
          <div class="store-options">
            <button
              v-for="opt in storeCountOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ active: settings.storeCount === opt.value, locked: !opt.unlocked }"
              @click="opt.unlocked && (settings.storeCount = opt.value)"
              :disabled="!opt.unlocked"
            >
              <span>{{ opt.label }}</span>
              <span v-if="!opt.unlocked" class="lock-icon">🔒</span>
            </button>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">⚔️ 难度选择</label>
          <div class="difficulty-options">
            <button
              v-for="opt in difficultyOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ active: settings.difficulty === opt.value, locked: !opt.unlocked }"
              @click="opt.unlocked && (settings.difficulty = opt.value)"
              :disabled="!opt.unlocked"
            >
              <div class="diff-info">
                <span class="diff-name">{{ opt.label }}</span>
                <span class="diff-desc">{{ opt.description }}</span>
              </div>
              <span v-if="!opt.unlocked" class="lock-icon">🔒</span>
            </button>
          </div>
        </div>

        <div class="menu-actions">
          <button class="btn btn-primary btn-lg" @click="$emit('startNew', settings)">
            🎮 新游戏
          </button>
          <button
            v-if="hasSavedGame"
            class="btn btn-success btn-lg"
            @click="$emit('loadGame')"
          >
            📂 继续游戏
          </button>
        </div>
      </div>

      <div class="stats-card card">
        <h3 class="stats-title">📊 游戏进度</h3>
        <div class="stats-grid">
          <div class="progress-item">
            <span class="progress-label">通关周目</span>
            <span class="progress-value">{{ unlocks.maxCycleCompleted }}</span>
          </div>
          <div class="progress-item">
            <span class="progress-label">历史最佳</span>
            <span class="progress-value grade" :class="'grade-' + unlocks.bestGrade">{{ unlocks.bestGrade }}</span>
          </div>
          <div class="progress-item">
            <span class="progress-label">最高分</span>
            <span class="progress-value">{{ unlocks.bestScore }}</span>
          </div>
          <div class="progress-item">
            <span class="progress-label">累计策略点</span>
            <span class="progress-value strategy">{{ unlocks.totalStrategyPoints }}</span>
          </div>
        </div>

        <div class="history-section" v-if="unlocks.cycleHistory && unlocks.cycleHistory.length > 0">
          <h4>最近游戏记录</h4>
          <div class="history-list">
            <div
              v-for="(record, idx) in recentHistory"
              :key="idx"
              class="history-item"
            >
              <span class="history-cycle">#{{ record.cycle }}</span>
              <span class="history-grade" :class="'grade-bg-' + record.grade">{{ record.grade }}</span>
              <span class="history-score">{{ record.score }} 分</span>
              <span class="history-sp">💎{{ record.strategyPoints }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="role-intro card">
      <h3>🎭 游戏角色介绍</h3>
      <div class="roles-grid">
        <div class="role-card">
          <div class="role-icon">📋</div>
          <div class="role-name">分配员</div>
          <div class="role-desc">负责将有限的资源分配到各个门店的不同维度，制定补货策略</div>
        </div>
        <div class="role-card">
          <div class="role-icon">🔔</div>
          <div class="role-name">提示员</div>
          <div class="role-desc">展示各门店的风险等级和突发事件，提醒注意事项</div>
        </div>
        <div class="role-card">
          <div class="role-icon">📝</div>
          <div class="role-name">复盘员</div>
          <div class="role-desc">在结算阶段查看详细的得分报告和经营数据，分析得失</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
  storeCountOptions: {
    type: Array,
    required: true
  },
  difficultyOptions: {
    type: Array,
    required: true
  },
  unlocks: {
    type: Object,
    required: true
  },
  hasSavedGame: {
    type: Boolean,
    default: false
  }
})

defineEmits(['startNew', 'loadGame'])

const settings = reactive({
  storeCount: 4,
  difficulty: 'normal'
})

const recentHistory = computed(() => {
  if (!props.unlocks.cycleHistory) return []
  return [...props.unlocks.cycleHistory].reverse().slice(0, 5)
})
</script>

<style scoped>
.main-menu {
  min-height: 100vh;
  padding: 40px 20px;
}

.menu-hero {
  text-align: center;
  margin-bottom: 40px;
}

.game-title {
  font-size: 42px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
}

.menu-container {
  max-width: 1100px;
  margin: 0 auto 40px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .menu-container {
    grid-template-columns: 1fr;
  }
}

.menu-card, .stats-card {
  padding: 32px;
}

.menu-title, .stats-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.store-options, .difficulty-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: #f8fafc;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-btn:hover:not(:disabled):not(.active) {
  border-color: var(--primary-color);
  background: #eef2ff;
}

.option-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.option-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f1f5f9;
}

.diff-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.diff-name {
  font-weight: 600;
}

.diff-desc {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 400;
}

.lock-icon {
  font-size: 14px;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;
}

.btn-lg {
  padding: 16px 28px;
  font-size: 16px;
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
}

.progress-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-value.grade {
  font-size: 32px;
}

.progress-value.grade.grade-S { color: #f59e0b; }
.progress-value.grade.grade-A { color: #10b981; }
.progress-value.grade.grade-B { color: #3b82f6; }
.progress-value.grade.grade-C { color: #8b5cf6; }
.progress-value.grade.grade-D { color: #64748b; }

.progress-value.strategy {
  color: #f59e0b;
}

.history-section h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
}

.history-cycle {
  color: var(--text-secondary);
  min-width: 30px;
}

.history-grade {
  padding: 2px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  color: white;
}

.grade-bg-S { background: #f59e0b; }
.grade-bg-A { background: #10b981; }
.grade-bg-B { background: #3b82f6; }
.grade-bg-C { background: #8b5cf6; }
.grade-bg-D { background: #64748b; }

.history-score {
  font-weight: 600;
  flex: 1;
}

.history-sp {
  color: #f59e0b;
  font-weight: 600;
}

.role-intro {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
}

.role-intro h3 {
  margin-bottom: 24px;
  font-size: 20px;
  color: var(--text-primary);
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.role-card {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  text-align: center;
  transition: transform 0.2s;
}

.role-card:hover {
  transform: translateY(-4px);
}

.role-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.role-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.role-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
