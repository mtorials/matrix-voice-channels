<template>
  <div class="selector">
    <a v-for="channel in getRooms"
    :key="channel.name"
    class="channel"
    @click="select(channel)"
    :class="{ selected: (channel.roomId === this.$route.params.id) }"
    >
      {{ channel.name }}
    </a>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Room } from "../matrix/msdk"
import { useStore } from '../store'

export default defineComponent({
  name: "ChannelSelector",
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    return {
      getRooms: computed(() => store.state.rooms),
      //getActiveRoom: computed((route.params as any).id),
      select: (room: Room) => router.push({ name: 'room', params: { id: room.roomId }})
    }
  },
  data() {
    return {
      channels: useStore().state.client.store.rooms.entries
    }
  }
})
</script>

<style lang="less">
.selector {
  border-radius: 10px;
  padding: 1rem;
  background-color: #151d25;
  display: flex;
  gap: 0.5rem;
}

.channel {
  border-radius: 10px;
  padding: 0.5rem;
  background-color: white;
  color: black;
}

.selected {
  background-color: orangered;
}
</style>