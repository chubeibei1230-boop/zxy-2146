<template>
  <div class="next-round-bar">
    <button class="btn btn-success btn-lg" @click="$emit('nextRound')">
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentRound: {
    type: Number,
    required: true
  },
  totalRounds: {
    type: Number,
    required: true
  }
})

defineEmits(['nextRound'])

const buttonText = computed(() => {
  return props.currentRound >= props.totalRounds ? '🏆 查看周目结算' : '➡️ 进入下一回合'
})
</script>

<style scoped>
.next-round-bar {
  position: sticky;
  bottom: 20px;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.next-round-bar .btn {
  padding: 16px 40px;
  font-size: 17px;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.btn-lg {
  padding: 12px 28px;
  font-size: 15px;
}
</style>
