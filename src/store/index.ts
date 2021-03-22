import MatrixIndex from '@/matrix'
import { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, Store } from 'vuex'
import { Room, MatrixClient } from '../matrix/msdk'

export interface State {
  client: MatrixClient,
  rooms: Map<string, Room>
  activeRoomId: string | undefined
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state: {
    client: new MatrixIndex().createClient(),
    rooms: new Map(),
    activeRoomId: undefined
  },
  mutations: {
    setRooms(state: State, rooms: Map<string, Room>) {
      state.rooms = rooms
    },
    setActiveRoomId(state: State, activeRoomId: string) {
      state.activeRoomId = activeRoomId
    }
  },
  actions: {
    refreshRooms(context) {
      const r = context.state.client.store.rooms
      const rooms: Room[] = Object.values(r).map((e: Room) => e)
      console.log(rooms)
      context.commit("setRooms", rooms)
    }
  },
  getters: {
    getActiveRoom(state) : Room | undefined {
      if (state.activeRoomId === undefined) return undefined
      return state.rooms.get(state.activeRoomId)
    }
  },
  modules: {
  }
})

export function useStore () {
  return baseUseStore(key)
}