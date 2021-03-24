<template>
  <div class="vchannel">
    <a class="name">{{ name }} | {{ status }}</a>
    <div class="inside">
      <input type="text" v-model="device">
      <button @click="fetch">Fetch</button>
      <button @click="join">Join</button>
      <button @click="leave">Leave</button>
      <a v-for="peer in peers"
      :key="peer[0]"
      class="client"
      >
        <a v-if="device === peer[1].name">{{ device }}</a>
        <a v-else>{{ peer[1].name }} : {{ peer[1].state }}</a>
        <audio v-bind:id="peer[0]" autoplay playsinline></audio>
      </a>
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
  state: string
  timestamp: number
}

interface Candidate {
  receiver: string
  candidate: RTCIceCandidate
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
          "join_state": state,
          "timestamp": new Date().getTime()
        }
        store.state.client.sendStateEvent(store.state.activeRoomId, "de.mtorials.test.callstate", content, device)
      },
      sendEvent: (type: string, body: string, sender: string, reciever: string | null) => {
        if (store.state.activeRoomId == undefined) return
        let content : any = {
          "rtc_type": type,
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
      rtcStatus: "",
      status: "LEFT",
      pendingCandidates: [] as Candidate[],
      localStream: new MediaStream,
      timeout: 20000,
    }
  },
  async created() {
    const store = useStore()
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })

    // send ICE cands with interval
    setInterval(() => {
      const cand = this.pendingCandidates.pop()
      if (cand === undefined) return
      if (this.peers.get(cand.receiver)?.connection.connectionState === "connected") return
      this.sendEvent("icecandidate", JSON.stringify(cand.candidate), this.device, cand.receiver)
    }, 1000);

    // Check for timed out clients
    setInterval(() => { 
      this.peers.forEach(peer => {
        if (peer.timestamp + this.timeout > new Date().getTime()) return
        this.peers.delete(peer.key)
        console.log("Peer just timed out at " + new Date().getTime() + " with timestamp " + peer.timestamp)
      })
    }, this.timeout);

    store.state.client.on("event", async (event: MatrixEvent) => {
      if (event.getType() !== "de.mtorials.test.callstate") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      this.handleStateEvent(event)
    })
    store.state.client.on("event", async (event: MatrixEvent) => {

      if (event.getType() !== "de.mtorials.test.call") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      const content = event.getContent()
      if (content.sender === this.device) return
      if (content.receiver !== this.device) return
      
      const peer = this.peers.get(content.sender)
      if (peer === undefined) {
        console.error("Peer unknown")
        return
      }

      if (content.rtc_type === "offer") {
        const offer = JSON.parse(content.body)
        console.log(offer)
        peer.connection.setRemoteDescription(new RTCSessionDescription(offer))

        this.prepareConnect(peer)

        const answer = await peer.connection.createAnswer()
        peer.connection.setLocalDescription(answer)
        this.sendEvent("answer", JSON.stringify(answer), this.device, content.sender)

      } else if (content.rtc_type === "icecandidate") {

        const candidate: RTCIceCandidate = JSON.parse(content.body)
        peer.connection.addIceCandidate(candidate).then(() => {
          console.log("Added ICECAND")
        }).catch((err) => {
          console.log("Error adding ICE")
          console.log(err)
        })

      } else if (content.rtc_type === "answer") {

        const answer = JSON.parse(content.body)
        peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })
  },
  methods: {
    handleStateEvent: async function (event: MatrixEvent) {
      if (event.getContent().join_state === "JOINED") {
        if (event.getContent().timestamp + this.timeout < new Date().getTime()) {
          console.log("Peer timed out some time ago!")
          return
        }
        const peer = this.peers.get(event.getStateKey())
        if (peer !== undefined) {
          peer.timestamp = event.getContent().timestamp
          return
        }
        const newPeer : Peer = {
          connection: new RTCPeerConnection({
            iceServers: [
              {
                urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"]
              }
            ],
            iceCandidatePoolSize: 10,
          }),
          key: event.getStateKey(),
          name: event.getStateKey(),
          state: "-",
          timestamp: event.getContent().timestamp
        }
        this.peers.set(newPeer.key, newPeer)
      } else if (event.getContent().join_state === "LEFT") {
        this.peers.get(event.getStateKey())?.connection.close()
        this.peers.delete(event.getStateKey())
      }
    },
    connectTo: async function (peer: Peer) {

      this.prepareConnect(peer)

      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)
      this.sendEvent("offer", JSON.stringify(offer), this.device, peer.key)
    },
    prepareConnect: async function (peer: Peer) {
      const remoteStream = new MediaStream()

      this.localStream.getTracks().forEach(track => {
        peer.connection.addTrack(track, this.localStream)
      })

      peer.connection.ontrack = event => {
        console.log("GETTING TRACK!")
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track)
        })
      };

      console.log(peer.key);
      (document.getElementById(peer.key) as HTMLAudioElement).srcObject = remoteStream;

      peer.connection.onconnectionstatechange = event => {
        console.log(peer.connection.connectionState)
        peer.state = peer.connection.connectionState
        if (peer.connection.connectionState === "connected") {
          console.log(peer.connection.getStats())
          console.log("CONNECTED!!!!")
        }
      }

      peer.connection.onicecandidate = event => {
        event.candidate && this.pendingCandidates.push({ receiver: peer.key, candidate: event.candidate })
      }
    },
    join: async function () {

      this.status = 'JOINED'
      this.setState(this.status, this.device);
      setInterval(() => { if (this.status === "JOINED") this.setState(this.status, this.device) }, this.timeout - 5000)

      //(document.getElementById("local") as HTMLVideoElement).srcObject = this.localStream
      this.peers.forEach(peer => {
        //if (peer.key === this.device)
        this.connectTo(peer)
      })
    },
    leave: function () {
      this.status = 'LEFT'
      this.setState(this.status, this.device)
      this.peers.forEach(peer => {
        peer.connection.close()
      })
    },
    fetch: function () {
      this.peers.clear()
      this.getJoinedEvents().forEach(event => {
        this.handleStateEvent(event)
      })
    }
  }
})
</script>

<style lang="less" scoped>
.vchannel {
  background-color: #151d25;
  width: 20rem;
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

video {
  width: 100%;
  border-radius: 10px;
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
