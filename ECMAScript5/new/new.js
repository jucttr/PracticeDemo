/**
 * 手写 new：模拟 `new F(...args)`（CommonJS 版，逻辑与 index.js 一致）
 * 规范章节锚点与已知边界见 index.js 顶部的「规范出处」注释块
 * @document https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new
 * @param {Function} F 构造函数
 * @param {...*} args 传给构造函数的参数
 * @returns {Object|Function} 实例对象，或构造函数显式返回的对象/函数
 */
function isConstructor(value) {
    // 对应规范 §7.2.4 IsConstructor：借引擎判断 value 有没有 [[Construct]]
    if (typeof value !== 'function') return false;
    try {
        Reflect.construct(function () {}, [], value);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = function newF (F, ...args) {
    // 0. EvaluateNew: If IsConstructor(ctor) is false, throw a TypeError exception
    if (!isConstructor(F)) {
        throw new TypeError('newF: F is not a constructor');
    }

    // 1 + 2. 新对象的原型指向 F.prototype；F.prototype 不是对象时退化为 Object.prototype
    const proto = F.prototype;
    const hasValidProto =
        (typeof proto === 'object' && proto !== null) || typeof proto === 'function';
    const obj = Object.create(hasValidProto ? proto : Object.prototype);

    // 3. 以 obj 为 this 执行构造函数体
    const result = F.apply(obj, args);

    // 4. 返回对象/函数则用返回值，否则（含 null、原始值、无 return）返回 obj
    const isObjectOrFunction =
        (typeof result === 'object' && result !== null) || typeof result === 'function';
    return isObjectOrFunction ? result : obj;
};
