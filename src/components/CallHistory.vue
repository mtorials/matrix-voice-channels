<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
      <a v-for="event in callEvents"
      :key="event.getId()"
      class="client"
      >
        {{ event.getSender() }} :: {{ event.getContent() }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, useSSRContext } from 'vue'
import { Client } from '../model/client'
import MatrixIndex from '../matrix'

import * as sdk from "matrix-js-sdk";
import { useStore } from '../store';
import { MatrixEvent } from '@/matrix/msdk';

export default defineComponent({
  name: 'VoiceChannel',
  setup() {
    const store = useStore()
    return {
      name: computed(() => {
        if (store.getters.getActiveRoom === undefined) return "-"
        return store.getters.getActiveRoom.name
      })
    }
  },
  created() {
    const store = useStore()
    store.state.client.on("event", (event: MatrixEvent) => {
      if (event.getType() !== "de.mtorials.test.call" && event.getType() !== "m.room.message") return
      console.log(event.getContent())
      if (event.getRoomId() !== store.state.activeRoomId) return
      this.callEvents.push(event)
    })
  },
  data() {
    return {
      callEvents: [] as MatrixEvent[],
    }
  },
  methods: {

  }
})
</script>

<style lang="less" scoped>
.vchannel {
  background-color: #151d25;
  width: 100%;
  padding: 1rem;
  border-radius: 10px;
  overflow: auto;
}

.inside {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.client {
  background-color: white;
  border-radius: 10px;
  color: black;
  padding: 5px
}

.name {
  text-decoration: underline;
}
</style>
