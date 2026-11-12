/**
 * 柯里化（Currying）是什么？
 *
 * 普通函数：一次把参数收齐才干活             add(1, 2, 3) -> 6
 * 柯里化后：每次只收一部分参数，收够了才干活   add(1)(2)(3) -> 6
 *
 * 中间那几层函数只做两件事：
 *   1. 用闭包把「已经收到的参数」记下来；
 *   2. 用 fn.length（函数声明时的形参个数）判断收够了没有。
 * 没收够 -> 继续返回一个函数；收够了 -> fn.apply(...) 真正执行。
 *
 * 它解决什么问题（同目录的场景文件按这四类组织）：
 *   - 参数复用：把不常变的参数先固定，得到一个「场景专用函数」；
 *   - 延迟执行：配置先给、数据后到，执行时机交给事件 / 定时器决定；
 *   - 单参化：把多参函数变成单参函数，才串得进 compose / pipe 这类流水线；
 *   - 分步传参：配置 -> 依赖 -> 数据，每层固定一类东西（HOC、中间件链）。
 *
 * 两个容易混的概念：
 *   - 柯里化：n 个参数 -> n 层一元函数，add(1)(2)(3)；
 *   - 偏函数 / 部分应用：固定前几个参数，剩下的仍可一次传多个，add(1)(2, 3)。
 * 下面这份通用 curry 是工程里常用的「宽松版」，两种都支持。
 *
 * 运行：node index.js
 */

'use strict';

/* ==================== 1. 先手动写一次，看清形态 ==================== */

function add(a, b, c) {
    return a + b + c;
}

// 手写柯里化：每层只收一个参数，外层参数靠闭包留给内层用
function addCurried(a) {
    return function (b) {
        return function (c) {
            return a + b + c;
        };
    };
}
// ES6 箭头函数可以压成一行：const addCurried = a => b => c => a + b + c;

console.log('手动柯里化:', addCurried(1)(2)(3)); // 6

/* ==================== 2. 通用 curry 工具（主实现） ==================== */

/**
 * @param {Function} fn       要柯里化的函数
 * @param {...any} presetArgs 可选预置参数：curry(fn, 10) 相当于已经先传了 10
 */
function curry(fn, ...presetArgs) {
    return function curried(...args) {
        const allArgs = presetArgs.concat(args);

        if (allArgs.length >= fn.length) {
            return fn.apply(this, allArgs); // 收够了，执行
        }
        // 没收够：把已收参数作为下一轮的预置参数，重新柯里化
        // 用递归而不是闭包累加，是为了避免预置参数被重复拼接
        return curry(fn, ...allArgs);
    };
}

const curriedAdd = curry(add);
console.log('四种调用方式:');
console.log(curriedAdd(1, 2, 3)); // 6 一次收齐
console.log(curriedAdd(1)(2)(3)); // 6 逐层收
console.log(curriedAdd(1, 2)(3)); // 6 混合
console.log(curriedAdd(1)(2, 3)); // 6 混合
console.log('预置参数:', curry(add, 10)(20, 30)); // 60

/* ==================== 3. 几个实现变体 ==================== */
/* 这些差异原本各占一个文件；它们是知识点，不是五种不同的柯里化。 */

// (1) ES5 写法：没有 rest / 展开运算符，用 arguments + slice + concat
function curryES5(fn) {
    var preset = Array.prototype.slice.call(arguments, 1);
    return function curried() {
        var allArgs = preset.concat(Array.prototype.slice.call(arguments));
        return allArgs.length >= fn.length
            ? fn.apply(this, allArgs)
            : curryES5.apply(this, [fn].concat(allArgs));
    };
}
console.log('ES5 版:', curryES5(add)(1)(2)(3)); // 6

// (2) this 保持：主实现里分步调用会丢 this（一次性收齐则不会）
//     箭头函数捕获外层的 this，就能沿着调用链传下去
function curryKeepThis(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return (...nextArgs) => curried.apply(this, args.concat(nextArgs));
    };
}
const counter = {
    base: 100,
    sum: curryKeepThis(function (a, b) {
        return this.base + a + b;
    }),
};
console.log('this 保持:', counter.sum(1)(2)); // 103

// (3) fn.length 的坑：它只数到「第一个带默认值的形参」为止
function withDefault(a, b = 2, c) {
    return a + b + c;
}
console.log('fn.length:', withDefault.length); // 1，而不是 3
// 有默认值 / rest 参数的函数，别依赖 fn.length，显式告诉 curry 要收几个：
function curryN(fn, arity) {
    return function curried(...args) {
        return args.length >= arity
            ? fn.apply(this, args)
            : (...nextArgs) => curried.apply(this, args.concat(nextArgs));
    };
}
console.log('显式 arity:', curryN(withDefault, 3)(1)(2)(3)); // 6

// (4) 经典题 add(1)(2)(3) === 6 的另一条路：不靠 fn.length，靠隐式转换
//     和上面的 curry 不是同一个机制（原来的 index.js 把它俩混在一起了）
function sum(...args) {
    const total = args.reduce((acc, n) => acc + n, 0);
    const next = (...more) => sum(total, ...more);
    next.valueOf = () => total;
    next.toString = () => String(total);
    return next;
}
console.log('无限累加:', sum(1)(2)(3).valueOf(), Number(sum(1)(2, 3))); // 6 6
