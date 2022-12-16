<template>
    <div class="game-container">

        <div
            class="mine-sweeper-container"
            @contextmenu.prevent
        >
            <div
                v-for="i in height"
                :key="i"
                class="mine-sweeper-row"
            >
                <div
                    v-for="j in width"
                    :key="j"
                    class="mine-sweeper-item"
                    :class="{ 'is-open': openStatus[(i - 1) * width + j - 1] }"
                    @click.left="handleLeftClick(i - 1, j - 1)"
                    @click.right="handleRightClick(i - 1, j - 1)"
                >
                    <span
                        v-if="markStatus[(i - 1) * width + (j - 1)] === 1"
                        class="iconfont"
                    >&#xe778;</span>
                    <span
                        v-else-if="markStatus[(i - 1) * width + (j - 1)] === 2"
                        class="iconfont"
                    >&#xe720;</span>
                    <template v-else-if="openStatus[(i - 1) * width + (j - 1)]">
                        <span
                            v-if="mines[(i - 1) * width + (j - 1)]"
                            class="iconfont"
                        >&#xe63a;</span>
                        <span v-else-if="neighbourMineCount[(i - 1) * width + (j - 1)] > 0">
                            {{ neighbourMineCount[(i - 1) * width + (j - 1)] }}
                        </span>
                    </template>
                </div>
            </div>
        </div>
        <div class="panel-container">
            <div class="panel-data-container">
                <span
                    class="iconfont"
                    style="font-size: 60px"
                >&#xe778;</span>
                <div>{{ selectedMineCount }} / {{ mineCount }}</div>
            </div>

                <button
                    class="mine-sweeper-button"
                    @click="reStart"
                >
                    重开一局
                </button>

                <button
                    class="mine-sweeper-button"
                    style="margin-top: 15px"
                    @click="$emit('selectDifficulty')"
                >
                    改变难度
                </button>

        </div>
    </div>
</template>

<script>
function shuffle(mines, start) {
    for (let i = start; i < mines.length; i++) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const tmp = mines[randomIndex];
        mines[randomIndex] = mines[i];
        mines[i] = tmp;
    }
}

export default {
    props: {
        play: {
            type: Boolean,
            required: true,
        },
        width: {
            type: Number,
            required: true,
        },
        height: {
            type: Number,
            required: true,
        },
        mineCount: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            isEnd: false,
            mines: [],
            openStatus: [],
            markStatus: [],
            selectedMineCount: 0,
            heartBeat: -1,
        };
    },
    computed: {
        neighbourMineCount() {
            const result = new Array(this.width * this.height).fill(0);
            for (let i = 0; i < result.length; i++) {
                if (!this.mines[i]) {
                    continue;
                }
                const y = i % this.width;
                const x = (i - y) / this.width;
                for (let j = -1; j < 2; j++) {
                    const newX = x + j;
                    if (newX < 0 || newX === this.height) {
                        continue;
                    }
                    for (let k = -1; k < 2; k++) {
                        const newY = y + k;
                        if (newY < 0 || newY === this.width) {
                            continue;
                        }
                        result[newX * this.width + newY]++;
                    }
                }
            }
            return result;
        },
    },
    watch: {
        play() {
            if (!this.play) {
                return;
            }
            this.init(this.width, this.height, this.mineCount);
        },
        selectedMineCount() {
            if (this.selectedMineCount === this.mineCount) {
                const match = this.mines.every((isMine, index) => {
                    if (
                        (isMine && this.markStatus[index] === 1) ||
            (!isMine && this.markStatus[index] !== 1)
                    ) {
                        return true;
                    }
                    return false;
                });
                if (match) {
                    this.$nextTick(() => {
                        this.$layer.alert("win");
                    });
                    this.isEnd = true;
                }
            }
        },
    },
    created() {
        console.log("start");
        var ws;
        // var ws = new WebSocket("ws://127.0.0.1:22293/ws");
        if(process.env.NODE_ENV == 'production'){
            ws = new WebSocket("ws://" + location.host + "/sw");
        }else{
            ws = new WebSocket("ws://10.0.90.95:38293/sw");
        }
        // var ws = new WebSocket("ws://" + location.host + "/sw");

        //申请一个WebSocket对象，参数是服务端地址，同http协议使用http://开头一样，WebSocket协议的url使用ws://开头，另外安全的WebSocket协议使用wss://开头
        ws.onopen = function () {
            //当WebSocket创建成功时，触发onopen事件
            console.log("open");
            ws.send('{"type":"hello"}'); //将消息发送到服务端
        };

        var _this = this;

        ws.onmessage = (e) => {
            //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
            console.log("收到消息", e.data);
            var json = JSON.parse(e.data);
            if (json.type == "init") {
                _this.initReal(json.width, json.height, json.mines);
            } else if (json.type == "handleLeftClick") {
                _this.handleLeftClickReal(json.x, json.y);
            } else if (json.type == "handleRightClick") {
                console.log("handleRightClick", json);
                _this.handleRightClickReal(json.x, json.y);
            }
        };
        ws.onclose = (e) => {
            //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
            console.log("close");
            this.$layer.alert("连接中断，刷新页面");
            clearInterval(this.heartBeat);
            this.heartBeat = -1;
        };
        ws.onerror = (e) => {
            //如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
            console.log(e);
            clearInterval(this.heartBeat);
            this.heartBeat = -1;
        };

        window.sw = ws;

        this.heartBeat = setInterval(() => {
            window.sw.send(JSON.stringify({
                type: "ping", 
            }));
        }, 1000);
    },
    methods: {
        reStart() {
            this.init(this.width, this.height, this.mineCount);
        },
        init(width, height, mineCount) {
            this.isEnd = false;
            const total = width * height;
            const mines = new Array(total).fill(0);
            for (let i = 0; i < mineCount; i++) {
                mines[i] = 1;
            }
            shuffle(mines, mineCount);
            window.sw.send(
                JSON.stringify({
                    type: "init",
                    width: width,
                    height,
                    width,
                    mines: mines,
                })
            );

            var r = function RandomNum(Min, Max) {
                var Range = Max - Min;
                var Rand = Math.random();
                var num = Min + Math.floor(Rand * Range); //舍去
                return num;
            };

            // 随机开局
            this.handleLeftClick(r(0,width),r(0,height));
        },
        initReal(width, height, mines) {
            this.mines = mines;
            // this.width = json.width;
            // this.height = json.height;
            this.openStatus = new Array(width * height).fill(0);
            this.markStatus = new Array(width * height).fill(0);
            this.selectedMineCount = 0;
            console.log("initReal", this.openStatus, this.markStatus);
        },
        handleLeftClick(x, y) {
            window.sw.send(JSON.stringify({
                type: "handleLeftClick",
                x: x,
                y: y, 
            }));
        },
        handleLeftClickReal(x, y) {
            if (this.isEnd) {
                return;
            }
            const index = x * this.width + y;
            if (this.openStatus[index] === 1 || this.markStatus[index] === 1) {
                return;
            }

            if (this.mines[index]) {
                this.openStatus.splice(index, 1, 1);
                this.isEnd = true;
                this.$layer.alert("mine");

                for(var i =0;i<this.openStatus.length;i++){
                    this.openStatus[i]=1;
                }

                return;
            }
            if (this.neighbourMineCount[index] > 0) {
                this.openStatus.splice(index, 1, 1);
                return;
            }
            this.floodfill(x, y);
        },
        floodfill(x, y) {
            if (x < 0 || y < 0 || x === this.height || y === this.width) {
                return;
            }
            const index = x * this.width + y;
            if (this.openStatus[index] === 1) {
                return;
            }
            this.openStatus.splice(index, 1, 1);
            if (this.neighbourMineCount[index] > 0) {
                return;
            }
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    this.floodfill(x + i, y + j);
                }
            }
        },
        handleRightClick(x, y) {
            window.sw.send(JSON.stringify({
                type: "handleRightClick",
                x: x,
                y: y, 
            }));
        },
        handleRightClickReal(x, y) {
            if (this.isEnd) {
                return;
            }
            const index = x * this.width + y;
            if (this.openStatus[index] === 1) {
                return;
            }
            this.markStatus.splice(index, 1, (this.markStatus[index] + 1) % 3);
            if (this.markStatus[index] === 1) {
                this.selectedMineCount++;
            } else if (this.markStatus[index] === 2) {
                this.selectedMineCount--;
            }
        },
    },
};
</script>

<style scoped>
.game-container {
  /* display: flex; */
  justify-content: space-between;
  padding: 0 15px;
}

.mine-sweeper-container {
  overflow: hidden;
  width: fit-content;
  margin: 0 auto;
  background-color: #f2f1f0;
}

.mine-sweeper-row {
  display: flex;
}

.mine-sweeper-item {
  width: 50px;
  height: 50px;
  margin: 2px;
  line-height: 50px;
  font-size: 34px;
  text-align: center;
  background-color: #babdb6;
  cursor: pointer;
}

.mine-sweeper-item.is-open {
  background-color: #dededc;
}

.panel-container {
  width: 100%;
  margin:0 auto;
  text-align: center;
  flex-direction: column;
  justify-content: space-between;
}

.panel-container>div {
  width: 120px;
  display:inline-block;
}

.panel-data-container {
  padding-top: 15px;
  text-align: center;
}
</style>
