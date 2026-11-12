/**
 * 场景三：函数组合 —— compose / pipe
 *
 * 前提：compose 和 pipe 只能串联「单参函数」（上一个的输出是下一个的唯一输入）。
 * 柯里化在这里的作用：把多参函数先固定一部分参数，变成单参函数，才有资格进流水线。
 * 换句话说：compose/pipe 本身不是柯里化，柯里化是让函数能串起来的前提。
 *
 * 【状态管理库中的对应】
 * - Redux `compose(...funcs)`：从右往左组合单参函数，用来把多个 store enhancer 串起来，
 *   典型用法是 compose(applyMiddleware(thunk), devToolsEnhancer)(createStore)。
 *   本仓库 NodeJS/compose/redux.js 就是它的源码（注释写明「组合单参数函数」）。
 * - Ramda（函数式工具库，非框架）`R.compose` / `R.pipe`：所有函数默认自动柯里化，
 *   这就是「为什么单参化是组合前提」在真实库里的体现。
 *
 * 运行：node "函数组合之compose&pipe.js"
 */

'use strict';

// ---------- 例子1：compose 与 pipe 的差别只在方向 ----------
const compose =
    (...fns) =>
    x =>
        fns.reduceRight((v, f) => f(v), x); // 从右往左执行
const pipe =
    (...fns) =>
    x =>
        fns.reduce((v, f) => f(v), x); // 从左往右执行，更符合阅读顺序

const toUpper = str => str.toUpperCase();
const exclaim = str => `${str}!`;

const loudGreeting = compose(exclaim, toUpper);
console.log('compose:', loudGreeting('hello')); // HELLO!
console.log('pipe:', pipe(toUpper, exclaim)('hello')); // HELLO!

// ---------- 例子2：柯里化让多参函数能进流水线 ----------
// replaceAll 若写成 (target, replacement, str) => ... 是三元函数，没法直接传给 pipe。
// 改成柯里化形式后，replaceAll(' ', '_') 返回一个只收 str 的单参函数。

const replaceAll = (target, replacement) => str => str.split(target).join(replacement);
const trim = str => str.trim();

const normalize = pipe(
    trim,
    replaceAll(' ', '_'), // 柯里化：先固定查找/替换内容
    toUpper,
    exclaim,
);
console.log('柯里化 + pipe:', normalize('  hello world  ')); // HELLO_WORLD!

// ---------- 延伸：compose 的工程实现 ----------
// 见目录 NodeJS/compose/redux.js
// 见目录 NodeJS/compose/koa.js
