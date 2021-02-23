<template>
  <div id="app" v-cloak>
    <router-view/>
  </div>
</template>

<script>

  export default {
    name: 'app',
    created() {
      // 以下是刷新页面后动态恢复路由的关键
      if (sessionStorage.getItem("refresh") === "just") {
        this.initRouter();
        sessionStorage.removeItem("refresh")
      }
      window.addEventListener("beforeunload", () => {
        sessionStorage.setItem("refresh", "just")
      })
    },
    methods: {
      initRouter() {
        let routers = sessionStorage.getItem("routers");
        if (routers) {
          this.$router.addRoutes(JSON.parse(routers));
        }
      },
    }
  };
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
