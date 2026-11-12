// 'use strict';
// with (location) {
//     // with block 作用域
//     let qs = search.substring(1);
//     let hostName = hostname;
//     let url = href;
//     console.log(qs, hostName, url);
// }

// ======================================= 性能劣化（V8 优化失效） =======================================

// with ({ name: 'jucttr', age: 18 }) {
//     console.log(name, age);
// }

// // 测试代码
// const obj = { x: 1, y: 2 };

// // 正常访问属性
// function normalAccess() {
//     let sum = 0;
//     for (let i = 0; i < 1e6; i++) {
//         sum += obj.x + obj.y;
//     }
//     return sum;
// }

// // 使用 with 访问属性
// function withAccess() {
//     let sum = 0;
//     with (obj) {
//         for (let i = 0; i < 1e6; i++) {
//             sum += x + y; // 动态作用域查找
//         }
//     }
//     return sum;
// }

// // 性能测试
// console.time('normal');
// normalAccess();
// console.timeEnd('normal'); // 约 2ms（Chrome 示例）

// console.time('with');
// withAccess();
// console.timeEnd('with'); // 约 200ms（Chrome 示例）

// ======================================= 作用域污染与歧义 =======================================

// const data = { id: 1001 };

// function logInfo() {
//     const id = '全局ID';
//     with (data) {
//         console.log(id); // 输出 1001 还是 "全局ID"？
//     }
// }

// logInfo(); // 输出 1001（优先访问 with 对象属性）

// const id = '全局ID';

// // 若 data 无 id 属性则泄漏到全局
// const data2 = { name: 'test' };
// with (data2) {
//     console.log(id);
// }
