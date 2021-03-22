<template>
  <div class="vchannel">
    <a class="name">{{ name }}</a>
    <div class="inside">
      <input type="text" v-model="device">
      <button @click="audio">Audio</button>
      <button @click="call">Join</button>
      <button @click="leave">Leave</button>
      <a v-for="client in clients"
      :key="client.name"
      class="client"
      >
        {{ client.name }}
      </a>
      <video id="local" autoplay playsinline muted></video>
      <video id="remote" autoplay playsinline></video>
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
        if (store.getters.getActiveRoom == undefined) return "-"
        return store.getters.getActiveRoom.name
      }),
      sendEvent: (type: string, body: string, device: string) => {
        if (store.state.activeRoomId == undefined) return
        const content = {
          "msgtype": type,
          "body": body,
          "sender": device
        }
        store.state.client.sendEvent(store.state.activeRoomId, "de.mtorials.test.call", content, "")
      }
    }
  },
  data() {
    return {
      device: "Chrome",
      clients: [],
      pc: new RTCPeerConnection({
        iceServers: [
          {
            urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"]
          }
        ],
        iceCandidatePoolSize: 10,
      }),
      //localStream: null as MediaStream | null,
      //remoteStream: null as MediaStream | null,
    }
  },
  created() {
    const store = useStore()
    store.state.client.on("event", async (event: MatrixEvent) => {

      if (event.getType() !== "de.mtorials.test.call") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      const content = (event.getContent() as any)
      if (content.sender === this.device) return

      if (content.msgtype === "offer") {
        const offer = JSON.parse(content.body)
        this.pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await this.pc.createAnswer()
        //alert("ANSWER?")
        this.pc.setLocalDescription(answer)
        this.sendEvent("answer", JSON.stringify(answer), this.device)

        // Now signal ICE Cands
        this.pc.onicecandidate = event => {
          event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device)
        }

      } else if (content.msgtype === "icecandidate") {
        const candidate = JSON.parse(content.body)
        this.pc.addIceCandidate(candidate).then(() => {
          console.log("Added ICECAND")
        }).catch((err) => {
          console.log("Error adding ICE")
          console.log(err)
        })

      } else if (content.msgtype === "answer") {
        const answer = JSON.parse(content.body)
        this.pc.setRemoteDescription(new RTCSessionDescription(answer))
        //alert("OK!")
      }
    })
  },
  methods: {
    audio: async function () {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const remoteStream = new MediaStream()

      localStream.getTracks().forEach(track => {
        this.pc.addTrack(track, localStream)
      })

      this.pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track)
        })
      }

      (document.getElementById("remote") as HTMLVideoElement).srcObject = remoteStream;
      (document.getElementById("local") as HTMLVideoElement).srcObject = localStream
    },
    call: async function () {

      this.pc.onconnectionstatechange = event => {
        console.log(this.pc.connectionState)
        if (this.pc.connectionState === "connected") {
          console.log("CONNECTED!!!!")
        }
      }

      this.pc.onicecandidate = event => {
        event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device)
      }

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      this.sendEvent("offer", JSON.stringify(offer), this.device)
    }
  }
})
</script>

<style lang="less" scoped>
.vchannel {
  background-color: #151d25;
  width: 40%;
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
