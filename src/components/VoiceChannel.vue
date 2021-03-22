<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
      <button @click="send">Send Test Msg</button>
      <a
      v-for="client in clients"
      :key="client.name"
      class="client">
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
import { useStore } from 'vuex';

export default defineComponent({
  name: 'VoiceChannel',
  created() {
    let client : any = new MatrixIndex().createClient()

    client.on("Room.timeline", function(event: any, room: any, toStartOfTimeline: any) {
      if (event.getType() !== "m.room.message") {
        return; // only use messages
      }
      console.log(event.event.content.body);
    })

    client.startClient()
    this.client = client
  },
  data() {
    return {
      name: 'Test Channel',
      client: null
    }
  },
  methods: {
    send () {
      const content = {
        "body": "message text",
        "msgtype": "m.text"
      }
      if (this.client === null) return
      (this.client as any).sendEvent("!YIqYutrrBUdGDombnI:mtorials.de", "m.room.message", content, "", (err: any, res: any) => {
        console.log(err);
      })
    }
  }
})
</script>

<style lang="less">
.vchannel {
  background-color: #151d25;
  width: 12rem;
  padding: 1rem;
  border-radius: 10px;
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
