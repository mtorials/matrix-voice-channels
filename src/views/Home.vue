<template>
  <div class="home">
    <VoiceChannel/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VoiceChannel from '../components/VoiceChannel.vue';

export default defineComponent({
  name: 'Home',
  components: {
    VoiceChannel,
  },
});
</script>
