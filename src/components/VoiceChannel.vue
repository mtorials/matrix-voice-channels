<template>
  <div class="vchannel">
    <a class="name">{{ name }} | {{ status }}</a>
    <div class="inside">
      <input type="text" v-model="device">
      <button @click="join">Join</button>
      <button @click="leave">Leave</button>
      <a v-for="peer in peers"
      :key="peer[0]"
      class="client"
      >
        <a>{{ peer[1].name }}</a>
        <video v-bind:id="peer[0]" autoplay playsinline></video>
      </a>
      <video id="local" autoplay playsinline muted></video>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, useSSRContext } from 'vue'
import { Client } from '../model/client'
import MatrixIndex from '../matrix'

import * as sdk from "matrix-js-sdk";
import { useStore } from '../store';
import { MatrixEvent, Room } from '@/matrix/msdk';

interface Peer {
  key: string
  connection: RTCPeerConnection
  name: string
}

export default defineComponent({
  name: 'VoiceChannel',
  setup() {
    const store = useStore()
    const peersRef = reactive(new Map<string, Peer>())
    return {
      peers: peersRef,
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
        store.state.client.sendEvent(store.state.activeRoomId, "de.mtorials.test.call", content, "").catch((err) => {
          console.error(err)
        })
      },
      getJoinedEvents: () : MatrixEvent[] => {
        if (store.state.activeRoomId === undefined) {
          console.error("Not active room")
          return []
        }
        const room: Room = store.state.client.getRoom(store.state.activeRoomId)
        //console.log(room.currentState.getStateEvents("de.mtorials.test.callstate"))
        return room.currentState.getStateEvents("de.mtorials.test.callstate")
      }
    }
  },
  data() {
    return {
      device: "Chrome",
      status: "LEFT",
      localStream: new MediaStream
    }
  },
  async created() {
    const store = useStore()

    this.getJoinedEvents().forEach(event => {
      if (event.getContent().join_state !== "JOINED") return


    })
    store.state.client.on("event", async (event: MatrixEvent) => {
      if (event.getType() !== "de.mtorials.test.callstate") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      if (event.getContent().join_state === "JOINED")
      //this.connectTo(event.getStateKey())
      this.addPeer(event)
    })
    store.state.client.on("event", async (event: MatrixEvent) => {

      if (event.getType() !== "de.mtorials.test.call") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      const content = (event.getContent() as any)
      if (content.sender === this.device) return

      if (content.msgtype === "offer") {
        const peer = this.peers.get(content.sender)
        if (peer === undefined) {
          console.error("Peer unknown")
          return
        }
        const offer = JSON.parse(content.body)
        peer.connection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peer.connection.createAnswer()
        //alert("ANSWER?")
        peer.connection.setLocalDescription(answer)
        this.sendEvent("answer", JSON.stringify(answer), this.device, content.sender)

        // Now signal ICE Cands
        peer.connection.onicecandidate = event => {
          event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device, content.sender)
        }

      } else if (content.msgtype === "icecandidate") {
        const peer = this.peers.get(content.sender)
        if (peer === undefined) {
          console.error("Peer unknown")
          return
        }
        const candidate = JSON.parse(content.body)
        peer.connection.addIceCandidate(candidate).then(() => {
          console.log("Added ICECAND")
        }).catch((err) => {
          console.log("Error adding ICE")
          console.log(err)
        })

      } else if (content.msgtype === "answer") {
        const peer = this.peers.get(content.sender)
        if (peer === undefined) {
          console.error("Peer unknown")
          return
        }
        const answer = JSON.parse(content.body)
        peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
        //alert("OK!")
      }
    })
  },
  methods: {
    // add does not mean connect!!
    addPeer: async function (event: MatrixEvent) {
      const peer : Peer = {
        connection: new RTCPeerConnection({
          iceServers: [
            {
              urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"]
            }
          ],
          iceCandidatePoolSize: 10,
        }),
        key: event.getStateKey(),
        name: event.getStateKey()
      }
      this.peers.set(peer.key, peer)
    },
    connectTo: async function (peer: Peer) {

      const remoteStream = new MediaStream()

      this.localStream.getTracks().forEach(track => {
        peer.connection.addTrack(track, this.localStream)
      })

      peer.connection.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track)
        })
      }

      //(document.getElementById(peer.key) as HTMLVideoElement).srcObject = remoteStream;

      peer.connection.onconnectionstatechange = event => {
        console.log(peer.connection.connectionState)
        if (peer.connection.connectionState === "connected") {
          console.log("CONNECTED!!!!")
        }
      }

      let iceCount = 0

      peer.connection.onicecandidate = event => {
        if (iceCount > 0) return
        event.candidate && this.sendEvent("icecandidate", JSON.stringify(event.candidate), this.device, peer.key)
        iceCount = 1
      }

      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)

      this.sendEvent("offer", JSON.stringify(offer), this.device, peer.key)
    },
    join: async function () {

      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

      this.setState("JOINED", this.device);

      (document.getElementById("local") as HTMLVideoElement).srcObject = this.localStream
      this.peers.forEach(peer => {
        this.connectTo(peer)
      })
    },
    leave: function () {
      this.status = 'LEFT'
      this.setState(this.status, this.device)
      this.peers.forEach(peer => {
        peer.connection.close()
      })
      this.peers = new Map()
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
  color: black;
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
