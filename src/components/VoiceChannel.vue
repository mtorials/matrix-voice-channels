<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
      <button @click="send">Send Test Msg</button><br>
      <a v-for="client in clients"
      :key="client.name"
      class="client"
      >
        {{ client.name }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, useSSRContext } from 'vue'
import { Client } from '../model/client'
import MatrixIndex from '../matrix'

import * as sdk from "matrix-js-sdk";
import { useStore } from '../store';

export default defineComponent({
  name: 'VoiceChannel',
  setup() {
    const store = useStore()
    return {
      send: () => {
        if (store.state.activeRoomId === undefined) return
        const content = {
          "body": "message text",
          "msgtype": "m.text"
        }
        store.state.client.sendEvent(store.state.activeRoomId, "m.room.message", content, "")
      }
    }
  },
  data() {
    return {
      name: 'Test Channel',
      clients: [{ name: "Test 1" }]
    }
  },
  methods: {

  }
})
</script>

<style lang="less">
.vchannel {
  background-color: #151d25;
  width: 12rem;
  padding: 1rem;
  border-radius: 10px;
  overflow: auto;
}

.inside {
  padding: 1rem
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
