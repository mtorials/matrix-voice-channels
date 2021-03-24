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
  name: string,
  state: string
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
          "join_state": state
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
      localStream: new MediaStream
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
    }, 1000)

    store.state.client.on("event", async (event: MatrixEvent) => {
      if (event.getType() !== "de.mtorials.test.callstate") return
      if (event.getRoomId() !== store.state.activeRoomId) return
      if (event.getContent().join_state === "JOINED") {
        this.addPeer(event)
      } else if (event.getContent().join_state === "LEFT") {
        this.peers.get(event.getStateKey())?.connection.close()
        this.peers.delete(event.getStateKey())
      }
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
    // add does not mean connect!!
    addPeer: async function (event: MatrixEvent) {
      if (event.getContent().join_state !== "JOINED") return
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
        name: event.getStateKey(),
        state: "-"
      }
      this.peers.set(peer.key, peer)
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
        //if (event.getStateKey() === this.device) return
        if (event.getContent().join_state !== "JOINED") return
        this.addPeer(event)
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
