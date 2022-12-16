<template>
  <div id="app">
    <MineSweeper
              :width="width"
              :height="height"
              :mine-count="mineCount"
              class="app-section"
           />
  </div>
</template>

<script>
import MineSweeper from '@/components/MineSweeper';

export default {
  name: 'App',
  components: {
      MineSweeper,
  },
  data () {
      return {
          isShowGame: false,
          width: 30,
          height: 16,
          mineCount: 99,
      };
  },
  created(){
      this.showGame(30,16,99);
  },
  methods: {
      showGame (width, height, mineCount) {
          this.width = width;
          this.height = height;
          this.mineCount = mineCount;
          this.isShowGame = true;
      },
      selectDifficulty () {
          this.isShowGame = false;
      },
  },
};
</script>

<style scoped>
html,body{
  width: 100%;
  margin:0;
}
#app {

  min-height: 100vh;
}

.app-main {
  width: 100%;
  /* transition: transform 1s ease; */
}

.app-main.show-game {
  transform: translateX(-100%);
}

.app-section {
  width: 100%;
  flex: 0 0 auto;
}
</style>
