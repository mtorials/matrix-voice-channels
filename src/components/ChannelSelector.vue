<template>
  <div class="selector">
    <a v-for="channel in getRooms"
    :key="channel.name"
    class="channel"
    @click="select(channel)"
    :class="{ selected: (channel.roomId === getActiveRoom) }"
    >
      {{ channel.name }}
    </a>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { Room } from "../matrix/msdk"
import { useStore } from '../store'

export default defineComponent({
  name: "ChannelSelector",
  setup() {
    const store = useStore()
    return {
      getRooms: computed(() => store.state.rooms),
      getActiveRoom: computed(() => store.state.activeRoomId),
      select: (room: Room) => store.commit("setActiveRoomId", room.roomId)
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