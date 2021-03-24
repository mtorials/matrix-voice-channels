import MatrixIndex from '@/matrix'
import { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, Store } from 'vuex'
import { Room, MatrixClient } from '../matrix/msdk'

export interface State {
  client: MatrixClient,
  rooms: Room[]
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state: {
    client: new MatrixIndex().createClient(),
    rooms: []
  },
  mutations: {
    setRooms(state: State, rooms: Room[]) {
      state.rooms = rooms
    }
  },
  actions: {
    refreshRooms(context) {
      const r = context.state.client.store.rooms
      const rooms: Room[] = Object.values(r).map((e: Room) => e)
      //console.log(rooms)
      context.commit("setRooms", rooms)
    }
  },
  getters: {
  },
  modules: {
  }
})

export function useStore () {
  return baseUseStore(key)
}