<template>
  <div class="home">
    <VoiceChannel/>
    <call-history/>
  </div>
</template>

<script lang="ts">
import CallHistory from '@/components/CallHistory.vue';
import { defineComponent } from 'vue';
import VoiceChannel from '../components/VoiceChannel.vue';

export default defineComponent({
  name: 'Home',
  components: {
    VoiceChannel,
    CallHistory
  },
});
</script>

<style lang="less">
.home {
  display: flex;
  gap: 1rem;
}
</style>