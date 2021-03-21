import MatrixIndex from '@/matrix'
import { createStore } from 'vuex'

export default createStore({
  state: {
    client: new MatrixIndex().createClient()
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
