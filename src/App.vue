<template>
  <h1>MXVoice | Proof of Concept</h1>
  <router-view/>
</template>

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
