/**
 * ============================================================
 * new 一个函数，到底发生了什么？
 * ============================================================
 *
 * 1、说说 new 一个函数发生什么？
 * ------------------------------------------------------------
 * `new F(...args)` 并不是「调用一次函数」这么简单，它调用的是函数内部的
 * [[Construct]] 方法（只有带 [[Construct]] 的函数才能被 new：普通 function、
 * class 可以；箭头函数、多数内置方法不行，会抛 TypeError）。
 *
 * 一句话本质：JS 先凭空造一个新对象，把这个新对象悄悄绑成构造函数的 this，
 * 让构造函数体去「装修」它，最后把对象交出来。
 * 所以 new 表达式的结果，和「函数调用的返回值」不是同一件事。
 *
 * 2、流程大概是怎么样的？
 * ------------------------------------------------------------
 * ① 创建一个全新的空对象 obj；
 * ② 令 obj 的 [[Prototype]] 指向 F.prototype（即 obj 继承自 F.prototype），
 *    这样 obj 能用原型上的方法，且 obj instanceof F === true；
 * ③ 以 obj 为 this、args 为参数执行构造函数体：F.apply(obj, args)，
 *    函数里的 this.x = ... 全部落在 obj 上（这一步是「初始化」）；
 * ④ 检查构造函数体的返回值 result，由它决定最终交出谁（见第 3 问）。
 *
 * 用代码概括（① + ② 可以一步做完）：
 *
 *   const obj = Object.create(F.prototype);
 *   const result = F.apply(obj, args);
 *   return isObjectOrFunction(result) ? result : obj;
 *
 * 两个容易忽略的细节：
 *  - F.prototype 若不是对象（比如被手动改成 null 或原始值），
 *    新对象的原型会退化为 Object.prototype；
 *  - new 期间 this 绑定优先级最高，bind/call/apply 预先绑的 this 会被忽略。
 *
 * 3、最终返回什么？
 * ------------------------------------------------------------
 * 只看构造函数体「返回值的类型」：
 *
 *  - 返回对象或函数（引用类型）
 *      → new 的结果就是这个返回值，第 ①②③ 步造出来的 obj 被直接丢弃，
 *        它上面挂的属性、原型继承统统白做；
 *  - 没有 return、返回原始值（undefined / number / string / boolean /
 *    symbol / bigint）、或 return null
 *      → 一律返回第 ① 步新建的 obj。
 *
 * 特别注意 null：typeof null === 'object' 是历史遗留 Bug，
 * 规范里 null 属于原始值，判断时必须单独排除，否则 new F() 会得到 null。
 *
 * 记忆口诀：构造函数显式给了「对象/函数」就听它的，否则听新对象的。
 * ============================================================
 */

/**
 * ============================================================
 * 规范出处（ECMA-262；章节号随年度版本变动）
 * ============================================================
 * 现行草案（tc39.es/ecma262，此处核对的是 ECMAScript 2027 draft）：
 *  - 13.3.5 The new Operator / 13.3.5.1.1 EvaluateNew
 *    https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-new-operator
 *  - 7.2.4 IsConstructor / 7.3.14 Construct
 *    https://tc39.es/ecma262/multipage/abstract-operations.html#sec-construct
 *  - 10.2.2 [[Construct]]（建对象、绑 this、返回值判定）
 *    https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ecmascript-function-objects-construct-argumentslist-newtarget
 *  - 10.1.13 / 10.1.14 原型取自 newTarget.prototype，非对象则退化
 *  - 28.1.2 Reflect.construct（标准内置的可编程 new）
 *    https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.construct
 *
 * ES5.1（对应本目录，官方页面 262.ecma-international.org/5.1/）：
 *  - 11.2.2 The new Operator
 *    https://262.ecma-international.org/5.1/#sec-11.2.2
 *  - 13.2.2 [[Construct]]（10 步算法）
 *    https://262.ecma-international.org/5.1/#sec-13.2.2
 *    第 9 步：If Type(result) is Object then return result. 第 10 步：Return obj.
 *
 * 行为基准：TC39 官方一致性测试套件 test262（ECMA TR/104）
 *    https://github.com/tc39/test262
 *
 * 注意：规范是规范性算法步骤（normative text），不是官方 JS 参考实现；
 * MDN 是文档，也不是标准文本。本文件属于「课堂近似」。
 *
 * 已知边界（没有硬凑，避免假装完全符合规范）：
 *  - 规范用 newTarget 取原型（§10.1.14），手写版近似为 F 本身；
 *    F.bind(...) / class extends / Reflect.construct 传第三参数时结果会不同；
 *  - 规范用 PrepareForOrdinaryCall + OrdinaryCallBindThis 管理执行上下文与 this，
 *    手写版用 apply 近似；realm 的默认原型写死为 Object.prototype；
 *  - class 只能通过 [[Construct]] 调用，手写版的 F.apply 无法构造 class
 *    （newF(SomeClass) 会抛 TypeError），这是纯手写版绕不过去的一点；
 *  - derived 构造器返回非 undefined 原始值时规范抛 TypeError，手写版不模拟。
 *  需要行为完全一致时，直接用 Reflect.construct(F, args) 或原生 new。
 * ============================================================
 */

/**
 * 对应规范 §7.2.4 IsConstructor：
 * 「If arg is not an Object, return false. If arg has a [[Construct]] internal method, return true.」
 * 把 value 当作 Reflect.construct 的 newTarget，借引擎判定它有没有 [[Construct]]，
 * 不会执行 value 的函数体（target 只是个空函数）。
 * 注意：这一步会读取 value.prototype，带 getter 时与规范的 IsConstructor 略有差异。
 * @param {*} value
 * @returns {boolean}
 */
function isConstructor(value) {
    if (typeof value !== 'function') {
        return false;
    }
    try {
        Reflect.construct(function () {}, [], value);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 手写 new：模拟 `new F(...args)`
 * @document https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new
 * @param {Function} F 构造函数
 * @param {...*} args 传给构造函数的参数
 * @returns {Object|Function} 实例对象，或构造函数显式返回的对象/函数
 */
function newF(F, ...args) {
    // 0. 对应 EvaluateNew 里的 `If IsConstructor(ctor) is false, throw a TypeError exception`。
    //    箭头函数、Generator、Math.max 等没有 [[Construct]]，不能 new。
    //    规范顺序是先求值参数列表、再做这一步检查；本函数被调用时参数已求值，行为一致。
    if (!isConstructor(F)) {
        throw new TypeError('newF: F is not a constructor');
    }

    // 1 + 2. 创建新对象，并令其 [[Prototype]] 指向 F.prototype。
    //    规范补充：F.prototype 本身不是对象时，退化为 Object.prototype。
    //    注意不能用 Object.create(null) 再手动赋 __proto__：无原型对象上没有
    //    那个访问器，赋值只会加一个普通属性，原型链其实没连上。
    const proto = F.prototype;
    const hasValidProto =
        (typeof proto === 'object' && proto !== null) || typeof proto === 'function';
    const obj = Object.create(hasValidProto ? proto : Object.prototype);

    // 3. 以 obj 为 this 执行构造函数体，函数里的 this.xxx 全部落在 obj 上。
    //    new 期间 this 绑定优先级最高，bind/call/apply 预绑的 this 会被忽略。
    const result = F.apply(obj, args);

    // 4. 返回值是「对象或函数」就交出它（obj 被丢弃）；
    //    否则（无 return、原始值、null）一律交出新创建的 obj。
    //    typeof null === 'object' 是历史 Bug，必须单独排除；
    //    函数属于 Object 类型，原生的 new 同样会把它作为结果返回。
    const isObjectOrFunction =
        (typeof result === 'object' && result !== null) || typeof result === 'function';
    return isObjectOrFunction ? result : obj;
}
