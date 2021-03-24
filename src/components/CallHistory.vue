<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
      <a v-for="event in callEvents"
      :key="event.id"
      class="client"
      >
        {{ event.sender }} {{ event.type }} {{ event.receiver }}
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

interface CallEvent {
  id: string
  sender: string
  receiver: string
  type: string
}

export default defineComponent({
  name: 'CallHistory',
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
      if (event.getType() !== "de.mtorials.test.call") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      let type : string | null = null
      if (event.getContent().rtc_type === "offer") {
        type = "want to connect to"
      } else if (event.getContent().rtc_type === "answer") {
        type = "accepts connection from"
      }
      if (type) this.callEvents.push({ sender: event.getContent().sender, receiver: event.getContent().receiver, type: type, id: event.getId() })
    })
  },
  data() {
    return {
      callEvents: [] as CallEvent[],
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
