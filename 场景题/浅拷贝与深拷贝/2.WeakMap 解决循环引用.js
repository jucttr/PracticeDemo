const symbolKey = Symbol('symbolKey');

const obj = {
    a: 1,
    b: '2',
    c: function () {
        console.log('ccc');
    },
    d: new Date(),
    e: /d+/,
    [symbolKey]: 'f',
    g: Symbol('g'),
};

obj.h = obj;

function deepClone(target, map = new WeakMap()) {
    if (target === null || typeof target !== 'object') return target;

    // 先翻登记簿，登记了，直接返回
    if (map.has(target)) return map.get(target);

    const result = Array.isArray(target) ? [] : {};

    map.set(target, result); // 必须在递归之前登记

    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            result[key] = deepClone(target[key], map);
        }
    }
    return result;
}

const newObj = deepClone(obj);
console.log(newObj);
