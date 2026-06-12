<template>
  <div class="hint-panel card">
    <div class="hint-header">
      <h4>{{ title }}</h4>
      <button class="btn btn-outline btn-sm" @click="$emit('close')">关闭</button>
    </div>
    <div class="hint-content">
      <div v-for="(hint, idx) in hints" :key="idx" class="hint-item">
        • {{ hint }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  hints: {
    type: Array,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.hint-panel {
  padding: 20px;
  margin-bottom: 20px;
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

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}
</style>
