<template>
  <a>matrix-voice-channls</a>
  <channel-selector/>
  <router-view/>
</template>

<script lang="ts">
import { computed, defineComponent, useSSRContext } from 'vue'
import { Room, MatrixEvent } from "./matrix/msdk"
import { useStore } from './store'
import ChannelSelector from './components/ChannelSelector.vue'

export default defineComponent({
  components: {
    ChannelSelector
  },
  setup() {
    const store = useStore()
    store.state.client.startClient()
    return {
      refreshRooms: () => store.dispatch("refreshRooms")
    }
  },
  created () {
    useStore().state.client.once('sync', (state, prevState, res) => {
      if(state === 'PREPARED') {
        this.refreshRooms()
      } else {
        console.log(state);
        process.exit(1);
      }
    });
  }
})
</script>

<style lang="less">
body {
  padding: 1rem;
  margin: 0;
  background-color: #2c3e50;
}

#app {
  font-family: 'Iosevka Slab', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
  width: 100%;
  display: grid;
  gap: 1rem;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
