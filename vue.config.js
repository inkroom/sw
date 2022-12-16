const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    // proxy: {
    //     '/ws2': {
    //         target: 'http://10.0.90.95:38081/',
    //         ws: true,
    //         changeOrigin: true
    //     },
    // },

    port: 32293,
    host:'127.0.0.1',
},
})
