/**
 * 场景五：延迟执行 —— 事件回调与定时器里预先绑定参数
 *
 * 和「代码复用之场景专用函数」的区别：
 *   那边是「同一个逻辑复用在不同场景」，重点是少写代码；
 *   这边是「配置先给、数据后到」，重点是执行时机由别人决定（事件触发 / 定时器到点）。
 *
 * 普通写法每注册一次回调，都要临时包一层箭头函数来捕获 id；
 * 柯里化把「捕获参数」提前做成专用函数，注册处直接把它交出去即可。
 *
 * 运行：node "延迟执行之事件与定时器.js"
 */

'use strict';

// ---------- 例子1：事件回调（用极简事件总线模拟 DOM 事件，方便直接跑） ----------
function createBus() {
    const listeners = [];
    return {
        on(type, handler) {
            listeners.push({ type, handler });
        },
        emit(type, event) {
            listeners.filter(l => l.type === type).forEach(l => l.handler(event));
        },
    };
}

const bus = createBus();

// 普通写法：闭包把参数写死在回调里，id 换个值就得再写一遍
bus.on('click', () => {
    console.log('[普通] 点击了 submit');
});

// 柯里化：先固定「是哪个按钮」，返回只收 event 的函数
const reportClick = buttonId => event => {
    console.log(`[柯里化] ${event.type} -> ${buttonId} @ ${event.time}`);
};

bus.on('click', reportClick('submit'));
bus.on('click', reportClick('cancel'));

bus.emit('click', { type: 'click', time: '23:00' });

// ---------- 例子2：定时器，三层柯里化 ----------
// schedule(delay) 固定「等多久」 -> (fn) 固定「做什么」 -> (...args) 最后才收数据
const schedule = delay => fn => (...args) => setTimeout(() => fn(...args), delay);

const after100ms = schedule(100);
const logWithTag = tag => message => console.log(`[${tag}] ${message}`);

after100ms(logWithTag('timer'))('100ms 后才打印');
after100ms(logWithTag('timer'))('第二条');

// 前两层都是「配置」，只有最后一层被调用时才真正执行 ——
// 这和通用 curry「没收够参数就先返回函数」是同一个思路，只是这里手写固定了层数。
