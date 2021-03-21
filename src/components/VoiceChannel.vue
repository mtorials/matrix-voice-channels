<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
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
import { defineComponent } from 'vue'
import { Client } from '../model/client'

import * as sdk from "matrix-js-sdk";
import { useStore } from 'vuex';

export default defineComponent({
  name: 'VoiceChannel',
  setup() {
    useStore().state.client.publicRooms(function(err: any, data: any) {
      console.log(data);
    })
  },
  data() {
    return {
      name: 'Test Channel',
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
