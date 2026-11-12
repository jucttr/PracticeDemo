/*
 * ============================================================================
 * 基础介绍：闭包（Closure）及其应用
 * ============================================================================
 * 1. 什么是闭包
 *    闭包 = 函数 + 这个函数「定义时」所在的词法环境（作用域链）。
 *    只要一个函数能记住并访问它定义时所在的作用域，哪怕它被拿到这个
 *    作用域之外去调用，就产生了闭包。
 *
 * 2. 形成闭包的三个条件
 *    ① 函数嵌套：外层函数里定义了内层函数；
 *    ② 内层函数引用了外层函数的变量；
 *    ③ 内层函数被返回、被保存或作为回调，在外层函数执行完之后才被调用。
 *
 * 3. 闭包为什么能「生效」（底层原因）
 *    ES5 只有全局作用域和函数作用域。函数每次被调用都会创建一个执行上下文，
 *    里面的变量对象（VO/AO）会挂到作用域链上，并被内层函数的 [[Scope]] 引用。
 *    外层函数执行结束后，本来它的变量对象该被回收；但只要返回的内层函数
 *    还活着（被变量存着、被注册成回调），作用域链就仍引用着这份变量对象，
 *    于是这些变量「留在了内存里」，之后随时能读、能改。
 *    一句话：内层函数没被销毁 => 它引用的外层变量也不会被销毁。
 *
 * 4. 两个必须记住的结论
 *    ① 闭包保存的是「同一个变量对象」，不是变量值的拷贝。所以内层函数读到
 *       的是变量的最终值，多个内层函数共享同一份外层变量（见场景 7）。
 *    ② 代价：被引用的外层变量无法回收，滥用会占内存；不用时应解除引用
 *       （把持有内层函数的变量置为 null）。
 *
 * 5. 组织方式
 *    一、基础示例  二、典型应用场景  三、使用注意点
 *    本文件全部使用 ES5 语法（var / function / arguments），不依赖 DOM，
 *    可直接用 node 运行，或由同目录的「闭包及其应用.html」在浏览器里打开，
 *    所有结论都用 console.log 输出到控制台。
 * ============================================================================
 */

// ============================================================================
// 一、基础示例：一个最小的闭包
//      （对照 作用域/closure.js 里用 debugger 观察 Closure 作用域的写法）
// ============================================================================

/*
 * 作用：让外层函数的局部变量 count 在函数调用结束之后，仍然可以被读取和修改。
 */
function createCounter() {
    var count = 0; // 外层函数的局部变量，本应在 createCounter 执行完后被回收

    return function () {
        count += 1; // 内层函数引用了外层变量
        return count;
    };
}

/*
 * 闭包生效原因：
 * createCounter() 返回了匿名函数，这个匿名函数的 [[Scope]] 仍引用着
 * createCounter 的变量对象，count 因此没有被回收；外面每次调用拿到的
 * 都是同一份 count，所以能持续累加。
 */
var counterA = createCounter();
console.log('【一】基础闭包，连续调用三次：', counterA(), counterA(), counterA()); // 1 2 3

/*
 * 作用：验证每调用一次外层函数，都会新建一份独立的变量对象。
 * 闭包生效原因：counterB 引用的是另一份 createCounter 变量对象，
 * 与 counterA 的 count 不是同一个变量，所以互不干扰。
 */
var counterB = createCounter();
console.log('【一】新实例从 1 开始：', counterB(), '；原实例继续累加：', counterA()); // 1 ； 4

// ============================================================================
// 二、典型应用场景
// ============================================================================

// ---------------------------------------------------------------------------
// 场景 1：私有变量与模块模式（IIFE + 返回接口）
// ---------------------------------------------------------------------------

/*
 * 作用：把数据和实现细节藏起来，只暴露约定的方法，外部无法直接改写内部状态。
 */
var account = (function () {
    var balance = 100; // 私有变量，外部访问不到

    return {
        deposit: function (money) {
            balance += money;
            return balance;
        },
        getBalance: function () {
            return balance;
        },
    };
})();

/*
 * 闭包生效原因：
 * IIFE 执行完只返回了两个方法，这两个方法定义时都在同一份 IIFE 变量对象里，
 * 它们的 [[Scope]] 都引用着 balance。所以 IIFE 早已执行结束，balance 依然
 * 存活，并且只有这两个方法能碰到它 —— 这就是「私有」的由来。
 */
console.log('【场景1】初始余额：', account.getBalance()); // 100
console.log('【场景1】外部直接读私有变量：', account.balance); // undefined
console.log('【场景1】存入 50 后：', account.deposit(50)); // 150

// ---------------------------------------------------------------------------
// 场景 2：函数工厂（预设参数，批量生产行为相似的函数）
// ---------------------------------------------------------------------------

/*
 * 作用：用同一套逻辑，按不同配置生成不同的函数，避免重复写代码。
 */
function makeAdder(x) {
    return function (y) {
        return x + y;
    };
}

/*
 * 闭包生效原因：
 * x 是 makeAdder 的局部变量，被返回的内层函数引用，于是每次调用
 * makeAdder 产生的 x 都跟着各自返回的函数一起活下来，彼此独立。
 */
var add10 = makeAdder(10);
var add100 = makeAdder(100);
console.log('【场景2】add10(5)：', add10(5), '；add100(5)：', add100(5)); // 15 ； 105

// ---------------------------------------------------------------------------
// 场景 3：柯里化 / 偏函数（对应同目录 ECMAScript5/柯里化/ 的实现）
// ---------------------------------------------------------------------------

/*
 * 作用：把「一次传齐参数」的函数改造成「可以分批传参」的函数，
 *      参数没凑够就先返回一个函数继续收，凑够了才真正执行。
 */
function curryES5(fn) {
    var arity = fn.length; // fn 声明的参数个数

    return function curried() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length >= arity) {
            return fn.apply(null, args);
        }
        return function () {
            var more = Array.prototype.slice.call(arguments, 0);
            return curried.apply(null, args.concat(more));
        };
    };
}

/*
 * 闭包生效原因：
 * 参数不够时返回的新函数，引用了外层 curried 调用里的 args 和 curried 本身；
 * 正是这两个被闭包「记住」的变量，让之前传过的参数一直留着，直到凑齐为止。
 */
function sum3(a, b, c) {
    return a + b + c;
}
var curriedSum = curryES5(sum3);
console.log('【场景3】curriedSum(1)(2)(3)：', curriedSum(1)(2)(3)); // 6
console.log('【场景3】curriedSum(1, 2)(3)：', curriedSum(1, 2)(3)); // 6

// ---------------------------------------------------------------------------
// 场景 4：缓存 / memoize（用闭包保存一份私有缓存，避免重复计算）
// ---------------------------------------------------------------------------

/*
 * 作用：同样的入参只计算一次，之后直接返回缓存结果，用于开销较大的纯函数。
 *      （局限：这里用参数拼接做 key，参数是对象时都会变成 [object Object]。）
 */
function memoize(fn) {
    var cache = {}; // 私有缓存，外部改不了

    return function () {
        var key = Array.prototype.join.call(arguments, ',');
        if (!Object.prototype.hasOwnProperty.call(cache, key)) {
            cache[key] = fn.apply(null, arguments);
        }
        return cache[key];
    };
}

var calcTimes = 0; // 仅用于演示：记录真正的计算被调用了几次
function slowSquare(n) {
    calcTimes += 1;
    return n * n;
}

/*
 * 闭包生效原因：
 * memoize 返回的函数一直引用着 cache 这个外层变量；只要 square 还在，
 * cache 就不会被回收，多次调用读到的都是同一份缓存表。
 */
var square = memoize(slowSquare);
console.log('【场景4】square(4)、square(4)、square(5)：', square(4), square(4), square(5)); // 16 16 25
console.log('【场景4】实际计算次数（应为 2）：', calcTimes); // 2

// ---------------------------------------------------------------------------
// 场景 5：防抖 debounce（连续触发只执行最后一次）
// ---------------------------------------------------------------------------

/*
 * 作用：搜索框联想、窗口 resize 后的重排等场景，避免高频触发时反复执行。
 */
function debounce(fn, wait) {
    var timer = null; // 闭包保存的定时器 id

    return function () {
        var context = this;
        var args = Array.prototype.slice.call(arguments, 0);
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            timer = null;
            fn.apply(context, args);
        }, wait);
    };
}

/*
 * 闭包生效原因：
 * timer、context、args 都在外层调用中声明，被返回的函数和 setTimeout 的
 * 回调共同引用。每次触发都能读到「上一次留下的 timer」并清掉它，从而
 * 实现重新计时；如果 timer 只是局部变量，每次调用都会从头开始，防抖失效。
 */
var debouncedLog = debounce(function (value) {
    console.log('【场景5】防抖最终执行（只应看到「第三次」）：', value);
}, 50);
debouncedLog('第一次');
debouncedLog('第二次');
debouncedLog('第三次'); // 约 50ms 后异步输出，前两次被取消

// ---------------------------------------------------------------------------
// 场景 6：节流 throttle（一段时间内最多执行一次）
// ---------------------------------------------------------------------------

/*
 * 作用：滚动监听、拖拽等场景，把高频触发压到固定频率。
 */
function throttle(fn, wait) {
    var lastTime = 0; // 闭包保存「上一次执行的时间」

    return function () {
        var now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            return fn.apply(this, arguments);
        }
    };
}

/*
 * 闭包生效原因：
 * lastTime 被返回的函数引用而常驻内存，每次触发都能和上一次执行时间比较；
 * 若没有闭包，调用之间就没有任何共享状态，也就无从判断「距上次多久」。
 */
var throttledLog = throttle(function (value) {
    console.log('【场景6】节流执行：', value);
}, 1000);
throttledLog('第 1 次'); // 立即执行
throttledLog('第 2 次'); // 1 秒内，被忽略

// ---------------------------------------------------------------------------
// 场景 7：循环绑定回调的经典陷阱（ES5 没有块级作用域）
// ---------------------------------------------------------------------------

/*
 * 作用：解释「为什么循环里生成的函数拿到的都是同一个 i」，以及如何修。
 */
var wrong = [];
for (var i = 0; i < 3; i++) {
    wrong.push(function () {
        return i;
    });
}

/*
 * 闭包生效原因（同时也是陷阱原因）：
 * ES5 里 var 只有函数作用域，三个内层函数共享外层同一份变量对象里的 i。
 * 闭包记住的是「变量本身」而不是「当时那一刻的值」，循环结束时 i 已经是 3，
 * 所以三个函数都返回 3。
 */
console.log('【场景7】陷阱，三次调用：', wrong[0](), wrong[1](), wrong[2]()); // 3 3 3

var right = [];
for (var j = 0; j < 3; j++) {
    right.push(
        (function (index) {
            return function () {
                return index;
            };
        })(j)
    );
}

/*
 * 修复后的闭包生效原因：
 * IIFE 每执行一轮就新建一个变量对象，参数 index 是这一轮独立的一份值；
 * 内层函数各自闭包住自己的 index，于是分别记住 0、1、2。
 * （ES6 的 let 会为每轮循环自动创建新绑定，所以不需要这层 IIFE。）
 */
console.log('【场景7】IIFE 修复后：', right[0](), right[1](), right[2]()); // 0 1 2

// ============================================================================
// 三、使用注意点
// ============================================================================
// 1. 内存：闭包让外层变量常驻内存；不再使用时把持有内层函数的变量置为 null，
//    方便垃圾回收（老版本 IE 里闭包与 DOM 节点互相引用还会造成内存泄漏，
//    可对照 ECMAScript5/内存剖析/内存泄漏.html）。
// 2. this：闭包不会自动继承外层的 this，它由调用方式决定。需要先固定时，
//    在外层用 var self = this; 保存，或用 apply / call / bind 指定。
// 3. 取值时机：闭包读到的是变量的最终值，不是定义时的快照（见场景 7）。
// 4. 想直观看到闭包：打开 作用域/closure.js，在内层函数里保留 debugger，
//    浏览器 Scope 面板会出现 Closure(fun) 一项，里面就是被引用的外层变量。
