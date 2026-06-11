<template>
  <div class="game-app">
    <MainMenu
      v-if="gameState.phase === 'menu'"
      :store-count-options="getStoreCountOptions()"
      :difficulty-options="getDifficultyOptions()"
      :unlocks="gameState.unlocks"
      :has-saved-game="hasSavedGame"
      @start-new="handleStartNew"
      @load-game="handleLoadGame"
    />

    <template v-else>
      <div class="game-header">
        <div class="header-left">
          <button class="btn btn-outline btn-sm" @click="confirmBackToMenu">
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
              :class="{ active: gameState.role === 'planner' }"
              @click="setRole('planner')"
            >
              📋 分配员
            </button>
            <button
              class="role-btn"
              :class="{ active: gameState.role === 'hint' }"
              @click="setRole('hint'); showHints = true"
            >
              🔔 提示员
            </button>
            <button
              class="role-btn"
              :class="{ active: gameState.role === 'reviewer' }"
              :disabled="gameState.phase !== 'settlement'"
              @click="setRole('reviewer')"
            >
              📝 复盘员
            </button>
          </div>
        </div>
        <div class="header-right">
          <div class="round-progress">
            <div class="round-info">
              回合进度
              <strong>{{ gameState.currentRound }} / {{ gameState.totalRounds }}</strong>
            </div>
            <div class="progress-bar round-bar">
              <div
                class="progress-fill"
                style="background: linear-gradient(90deg, #4f46e5, #7c3aed)"
                :style="{ width: (gameState.currentRound / gameState.totalRounds * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="game-body">
        <div v-if="showHints && gameState.role === 'hint'" class="hint-panel card mb-4">
          <div class="hint-header">
            <h4>🔔 提示员报告 - 风险预警</h4>
            <button class="btn btn-outline btn-sm" @click="showHints = false">关闭</button>
          </div>
          <div class="hint-content">
            <div v-for="(hint, idx) in riskHints" :key="idx" class="hint-item">
              • {{ hint }}
            </div>
          </div>
        </div>

        <div v-if="showPlannerTips && gameState.role === 'planner'" class="hint-panel card mb-4">
          <div class="hint-header">
            <h4>💡 分配员提示</h4>
            <button class="btn btn-outline btn-sm" @click="showPlannerTips = false">关闭</button>
          </div>
          <div class="hint-content">
            <div v-for="(hint, idx) in plannerHints" :key="idx" class="hint-item">
              • {{ hint }}
            </div>
          </div>
        </div>

        <ResourcePool
          :resource-info="resourceInfo"
          :total="gameState.resourcePool.total"
          :remaining="gameState.resourcePool.remaining"
          :cycle="gameState.currentCycle"
          :round="gameState.currentRound"
          :total-rounds="gameState.totalRounds"
          :strategy-points="gameState.accumulatedStrategyPoints"
        />

        <div class="controls-bar mb-4" v-if="gameState.phase === 'planning'">
          <button class="btn btn-warning" @click="showPlannerTips = true; setRole('planner')">
            💡 获取分配建议
          </button>
          <button class="btn btn-primary btn-lg" @click="confirmAllocation">
            ✅ 确认分配并结算
          </button>
        </div>

        <div class="stores-grid">
          <StoreCard
            v-for="store in gameState.stores"
            :key="store.id"
            :store="store"
            :resource-info="resourceInfo"
            :resource-pool-remaining="gameState.resourcePool.remaining"
            :show-results="gameState.phase === 'settlement'"
            :read-only="gameState.phase === 'settlement'"
            @allocate="allocateResource"
            @adjust="adjustResource"
          />
        </div>

        <SettlementReport
          v-if="gameState.phase === 'settlement' && gameState.currentRoundResult"
          :result="gameState.currentRoundResult"
          :round="gameState.currentRound"
        />

        <div class="next-round-bar mt-4" v-if="gameState.phase === 'settlement'">
          <button class="btn btn-success btn-lg" @click="nextRound">
            {{ gameState.currentRound >= gameState.totalRounds ? '🏆 查看周目结算' : '➡️ 进入下一回合' }}
          </button>
        </div>
      </div>

      <CycleComplete
        v-if="gameState.phase === 'cycleComplete' && gameState.cycleSummary"
        :summary="gameState.cycleSummary"
        :cycle="gameState.currentCycle"
        :unlocks="gameState.unlocks"
        @next-cycle="startNewCycle"
        @back-to-menu="backToMenu"
      />
    </template>

    <div v-if="showConfirmDialog" class="modal-overlay" @click.self="showConfirmDialog = false">
      <div class="modal-card card">
        <h3>⚠️ 确认返回主菜单？</h3>
        <p>当前游戏进度已自动保存到本地，你可以稍后通过「继续游戏」继续游玩。</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showConfirmDialog = false">取消</button>
          <button class="btn btn-danger" @click="backToMenu">确认返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from './composables/useGameStore.js'
import MainMenu from './components/MainMenu.vue'
import ResourcePool from './components/ResourcePool.vue'
import StoreCard from './components/StoreCard.vue'
import SettlementReport from './components/SettlementReport.vue'
import CycleComplete from './components/CycleComplete.vue'

const {
  gameState,
  totalScore,
  averageSatisfaction,
  averageStockoutRate,
  resourceInfo,
  hasSavedGame,
  initGame,
  allocateResource,
  adjustResource,
  confirmAllocation,
  nextRound,
  startNewCycle,
  backToMenu,
  loadSavedGame,
  setRole,
  getStoreCountOptions,
  getDifficultyOptions
} = useGameStore()

const showHints = ref(false)
const showPlannerTips = ref(false)
const showConfirmDialog = ref(false)

const riskHints = computed(() => {
  return gameState.stores.map(store => {
    const riskTexts = ['低', '中', '高', '很高', '极高']
    const riskDesc = riskTexts[Math.min(store.riskLevel - 1, 4)]
    const eventDesc = store.riskEvent ? `，触发【${store.riskEvent.name}】` : ''
    return `${store.name}（${store.type}）：需求 ${store.demand}，风险${riskDesc}${eventDesc}`
  })
})

const plannerHints = computed(() => {
  const hints = []
  gameState.stores.forEach(store => {
    if (store.riskEvent) {
      hints.push(`${store.name} 触发了【${store.riskEvent.name}】：${store.riskEvent.description}`)
    }
    if (store.riskLevel >= 3) {
      hints.push(`${store.name} 风险等级较高（${store.riskLevel}级），建议增加资源投入`)
    }
  })
  const remaining = gameState.resourcePool.remaining
  const total = gameState.resourcePool.total
  const infoMap = { stock: '库存量', staff: '人手数量', delivery: '配送次数', display: '陈列维护' }
  Object.keys(remaining).forEach(key => {
    if (remaining[key] > total[key] * 0.3) {
      hints.push(`${infoMap[key]}还有较多剩余（${remaining[key]}/${total[key]}），请充分利用`)
    }
  })
  if (hints.length === 0) {
    hints.push('各项指标正常，可根据各门店的需求预估来优化分配')
  }
  return hints
})

function handleStartNew(settings) {
  initGame(settings)
}

function handleLoadGame() {
  if (loadSavedGame()) {
    showHints.value = false
    showPlannerTips.value = false
  }
}

function confirmBackToMenu() {
  showConfirmDialog.value = true
}
</script>

<style scoped>
.game-app {
  min-height: 100vh;
}

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

.game-body {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.mb-4 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 20px;
}

.hint-panel {
  padding: 20px;
}

.hint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.hint-header h4 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid var(--primary-light);
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  position: sticky;
  top: 80px;
  z-index: 50;
}

.btn-lg {
  padding: 12px 28px;
  font-size: 15px;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.next-round-bar {
  position: sticky;
  bottom: 20px;
  display: flex;
  justify-content: center;
}

.next-round-bar .btn {
  padding: 16px 40px;
  font-size: 17px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  max-width: 450px;
  width: 100%;
  padding: 30px;
  text-align: center;
}

.modal-card h3 {
  margin-bottom: 12px;
  font-size: 20px;
}

.modal-card p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
