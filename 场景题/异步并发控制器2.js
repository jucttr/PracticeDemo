class AsyncController {
    constructor(concurrency) {
        this.concurrency = concurrency; // 最大并发数
        this.queue = []; // 任务队列
        this.activeCount = 0; // 当前运行任务数
    }

    add(task) {
        return new Promise((resolve, reject) => {
            // 封装任务及其回调
            const taskWrapper = () => {
                this.activeCount++;
                task()
                    .then(resolve, reject)
                    .finally(() => {
                        this.activeCount--;
                        this._next(); // 任务完成时触发下一个
                    });
            };
            // 若并发未满则立即执行，否则入队
            if (this.activeCount < this.concurrency) {
                taskWrapper();
            } else {
                this.queue.push(taskWrapper);
            }
        });
    }

    _next() {
        // 队列有任务且并发未满时执行下一个
        if (this.queue.length > 0 && this.activeCount < this.concurrency) {
            const nextTask = this.queue.shift();
            nextTask();
        }
    }
}

const controller = new AsyncController(2); // 并发上限2

// 模拟异步任务（如API请求）
const tasks = [1, 2, 3, 4].map(id => () => new Promise(resolve => setTimeout(() => resolve(`Task ${id} done`), 1000)));

tasks.forEach(task => {
    controller.add(task).then(console.log);
    // 输出：Task 1、2立即执行，3、4在1或2完成后执行
});
