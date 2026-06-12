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

    <template v-else-if="gameState.phase === 'cycleComplete' && gameState.cycleSummary">
      <CycleComplete
        :summary="gameState.cycleSummary"
        :cycle="gameState.currentCycle"
        :unlocks="gameState.unlocks"
        @next-cycle="startNewCycle"
        @back-to-menu="backToMenu"
      />
    </template>

    <template v-else>
      <GameHeader
        :total-score="totalScore"
        :average-satisfaction="averageSatisfaction"
        :role="gameState.role"
        :phase="gameState.phase"
        :current-round="gameState.currentRound"
        :total-rounds="gameState.totalRounds"
        @back-to-menu="confirmBackToMenu"
        @set-role="handleSetRole"
      />

      <div class="game-body">
        <HintPanel
          v-if="showHints && gameState.role === 'hint'"
          title="🔔 提示员报告 - 风险预警"
          :hints="riskHints"
          @close="showHints = false"
        />

        <HintPanel
          v-if="showPlannerTips && gameState.role === 'planner'"
          title="💡 分配员提示"
          :hints="plannerHints"
          @close="showPlannerTips = false"
        />

        <ResourcePool
          :resource-info="resourceInfo"
          :total="gameState.resourcePool.total"
          :remaining="gameState.resourcePool.remaining"
          :cycle="gameState.currentCycle"
          :round="gameState.currentRound"
          :total-rounds="gameState.totalRounds"
          :strategy-points="gameState.accumulatedStrategyPoints"
          :region-objective="gameState.regionObjective"
          :phase="gameState.phase"
          :current-round-objective-result="gameState.currentRoundObjectiveResult"
        />

        <GameControls
          v-if="gameState.phase === 'planning'"
          @show-tips="handleShowPlannerTips"
          @confirm-allocation="confirmAllocation"
        />

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
          :objective-result="gameState.currentRoundObjectiveResult"
          :region-objective="gameState.regionObjective"
        />

        <NextRoundBar
          v-if="gameState.phase === 'settlement'"
          :current-round="gameState.currentRound"
          :total-rounds="gameState.totalRounds"
          @next-round="nextRound"
        />
      </div>
    </template>

    <ConfirmDialog
      v-if="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :confirm-text="confirmDialogConfig.confirmText"
      :cancel-text="confirmDialogConfig.cancelText"
      @confirm="handleConfirmDialog"
      @close="showConfirmDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from './composables/useGameStore.js'
import { CONFIRM_DIALOG } from './config/constants.js'
import MainMenu from './components/MainMenu.vue'
import GameHeader from './components/GameHeader.vue'
import HintPanel from './components/HintPanel.vue'
import GameControls from './components/GameControls.vue'
import NextRoundBar from './components/NextRoundBar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ResourcePool from './components/ResourcePool.vue'
import StoreCard from './components/StoreCard.vue'
import SettlementReport from './components/SettlementReport.vue'
import CycleComplete from './components/CycleComplete.vue'

const {
  gameState,
  totalScore,
  averageSatisfaction,
  resourceInfo,
  hasSavedGame,
  riskHints,
  plannerHints,
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
const confirmDialogAction = ref(null)

const confirmDialogConfig = computed(() => {
  if (confirmDialogAction.value === 'backToMenu') {
    return CONFIRM_DIALOG.backToMenu
  }
  return { title: '', message: '', confirmText: '确认', cancelText: '取消' }
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

function handleSetRole(role) {
  setRole(role)
  if (role === 'hint') {
    showHints.value = true
  }
}

function handleShowPlannerTips() {
  showPlannerTips.value = true
  setRole('planner')
}

function confirmBackToMenu() {
  confirmDialogAction.value = 'backToMenu'
  showConfirmDialog.value = true
}

function handleConfirmDialog() {
  if (confirmDialogAction.value === 'backToMenu') {
    backToMenu()
  }
  showConfirmDialog.value = false
  confirmDialogAction.value = null
}
</script>

<style scoped>
.game-app {
  min-height: 100vh;
}

.game-body {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
</style>
