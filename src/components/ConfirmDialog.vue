<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card card">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button class="btn btn-outline" @click="$emit('close')">{{ cancelText }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ confirmText }}</button>
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
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

defineEmits(['confirm', 'close'])
</script>

<style scoped>
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
