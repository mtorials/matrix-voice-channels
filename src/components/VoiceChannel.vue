<template>
  <div class="vchannel">
    <a class="name">{{ name }} | {{ status }}</a>
    <div class="inside">
      <input type="text" v-model="device">
      <button @click="audio">Audio</button>
      <button @click="join">Join</button>
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
import { MatrixEvent, Room } from '@/matrix/msdk';

export default defineComponent({
  name: 'VoiceChannel',
  setup() {
    const store = useStore()
    return {
      name: computed(() => {
        if (store.getters.getActiveRoom == undefined) return "-"
        return store.getters.getActiveRoom.name
      }),
      setState: (state: string, device: string) => {
        if (store.state.activeRoomId === undefined) return
        const content = {
          "join_state": state
        }
        store.state.client.sendStateEvent(store.state.activeRoomId, "de.mtorials.test.callstate", content, device)
      },
      sendEvent: (type: string, body: string, sender: string, reciever: string | null) => {
        if (store.state.activeRoomId == undefined) return
        let content : any = {
          "msgtype": type,
          "body": body,
          "sender": sender
        }
        if (reciever) content["receiver"] = reciever
        store.state.client.sendEvent(store.state.activeRoomId, "de.mtorials.test.call", content, "")
      },
      getJoinedEvents: () : MatrixEvent[] => {
        const room: Room = store.getters.getActiveRoom
        console.log(room.currentState.getStateEvents("de.mtorials.test.callstate"))
        return room.currentState.getStateEvents("de.mtorials.test.callstate")
      }
    }
  },
  data() {
    return {
      device: "Chrome",
      status: "LEFT",
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
      if (event.getType() !== "de.mtorials.test.callstate") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      this.connectTo(event.getContent().sender)
    })
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
        this.sendEvent("answer", JSON.stringify(answer), this.device, content.sender)

        // Now signal ICE Cands
        this.pc.onicecandidate = event => {
          event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device, content.sender)
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
    connectTo: async function (receiver: string) {

      this.pc.onconnectionstatechange = event => {
        console.log(this.pc.connectionState)
        if (this.pc.connectionState === "connected") {
          console.log("CONNECTED!!!!")
        }
      }

      this.pc.onicecandidate = event => {
        event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device, receiver)
      }

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      this.sendEvent("offer", JSON.stringify(offer), this.device, receiver)
    },
    join: function () {
      this.status = 'JOIN'
      this.setState(this.status, this.device)
      this.getJoinedEvents().forEach(event => {
        this.connectTo(event.getContent().sender)
      })
    },
    leave: function () {
      this.status = 'LEAVE'
      this.setState(this.status, this.device)
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
