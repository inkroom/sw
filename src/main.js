import Vue from 'vue'
import App from './App.vue'
import '@/assets/css/common.css';
import layer from 'vue-layer';
import 'vue-layer/lib/vue-layer.css';

Vue.prototype.$layer = layer(Vue);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
