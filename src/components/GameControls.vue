<template>
  <div class="controls-bar">
    <button class="btn btn-warning" @click="$emit('showTips')">
      💡 获取分配建议
    </button>
    <button class="btn btn-primary btn-lg" @click="$emit('confirmAllocation')">
      ✅ 确认分配并结算
    </button>
  </div>
</template>

<script setup>
defineEmits(['showTips', 'confirmAllocation'])
</script>

<style scoped>
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
  margin-bottom: 20px;
}

.btn-lg {
  padding: 12px 28px;
  font-size: 15px;
}
</style>
