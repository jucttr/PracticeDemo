# JavaScript 中的浅拷贝与深拷贝（面试复习版）

> 目标：能讲清原理，能按场景选对方案，能手写一个靠谱的 deepClone，并扛住常见追问。

## 一、30 秒速答

面试官问「浅拷贝和深拷贝有什么区别」，可以直接这样答：

> 浅拷贝只复制对象的第一层：原始值按值复制，引用类型的属性只复制引用，所以嵌套对象在新旧对象之间是共享的。
> 
> 深拷贝会递归复制所有层级，新旧对象完全独立。这个差别的根源是 JS 里原始值按值存储、对象按引用存储。
> 
> 浅拷贝常用展开运算符、Object.assign、slice；深拷贝优先用 structuredClone，需要保留原型或处理特殊类型时用 lodash 的 cloneDeep 或自己实现。

## 二、先看翻车现场

```js
const state = { user: { name: 'Tom' }, tags: ['a'] };
const copy = { ...state };

copy.user.name = 'Jerry';
console.log(state.user.name); // 'Jerry'，原对象被改了

copy.tags = ['b'];
console.log(state.tags);      // ['a']，替换第一层属性不影响原对象
```

同样是改 copy，一个影响了原对象，一个没有。这就是浅拷贝的典型坑，在 React 里直接修改 state 的嵌套字段是同一类问题。

## 三、底层原理：值类型与引用类型

- **原始值**（string、number、boolean、null、undefined、symbol、bigint）：变量里直接存值，赋值就是复制值。
- **引用类型**（Object、Array、Function、Date、Map、Set 等）：数据存在堆里，变量里存的是指向堆的引用，赋值只复制这个引用。

三种操作的区别：

- **直接赋值**：只复制引用，两个变量指向同一个对象，第一层都共享。
- **浅拷贝**：新建一个对象，复制第一层属性；属性值是引用就复制引用。
- **深拷贝**：递归新建每一层，新旧对象之间不再共享任何引用。

```
变量（栈）          对象（堆）
state ──▶ A { user: ─▶ C { name }, tags: ─▶ D [ ] }
copy  ──▶ B { user: ─▶ C（同一个）, tags: ─▶ D（同一个） }
```

浅拷贝新建了 B，但 B 里的引用仍指向 C 和 D，所以改 C 两边都能看到。

## 四、浅拷贝

### 常见方式

| 类型 | 写法 |
| --- | --- |
| 对象 | `{ ...obj }`、`Object.assign({}, obj)` |
| 数组 | `[...arr]`、`arr.slice()`、`arr.concat()`、`Array.from(arr)` |

```js
const src = { a: 1, nested: { b: 2 } };
const c1 = { ...src };
const c2 = Object.assign({}, src);

c1.a = 100;
console.log(src.a);                     // 1，第一层互不影响
c1.nested.b = 200;
console.log(src.nested.b);              // 200，嵌套层共享
console.log(c2.nested === src.nested);  // true
```

### 易错点

- 展开运算符和 Object.assign 都只拷贝**自有可枚举属性**（包含 Symbol 键），**不拷贝原型**，所以 `{ ...new Foo() }` 得到的是普通对象。
- getter 会被求值，拷贝后变成普通数据属性。
- Object.assign 会触发目标对象的 setter，展开运算符不会。
- `Object.freeze` 也是浅的，只冻结第一层，嵌套对象仍可修改。

## 五、深拷贝方案对比

| 方案                              | 能处理                                               | 局限与坑                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JSON.parse(JSON.stringify(x))` | 纯 JSON 数据                                         | 1、对象属性里的 undefined、函数、Symbol 会被丢弃（数组里变 null）；<br>2、Date 变字符串；<br>3、NaN、Infinity 变 null；<br>4、Map、Set、RegExp 变 `{}`；<br>5、循环引用抛 TypeError；<br>6、BigInt 抛 TypeError；原型丢失 |
| `structuredClone(x)`            | 循环引用、Date、RegExp、Map、Set、ArrayBuffer、类型数组、Error 等 | 1、函数和 DOM 节点抛 DataCloneError；<br>2、原型丢失（类实例变普通对象）；<br>3、getter 只取值；<br>4、Symbol 键和不可枚举属性丢失；需 Node 17+ 或现代浏览器                                                           |
| `lodash.cloneDeep`              | 循环引用、Date、RegExp、Map、Set、Symbol 键，保留原型            | 函数保持原引用；引入依赖                                                                                                                                                           |
| 手写递归                            | 取决于实现，可控                                          | 要自己处理各种边界                                                                                                                                                              |

两个最常被问的 demo：

```js
const o = { a: undefined, b: () => {}, c: Symbol('s'), d: new Date(0), e: NaN, f: new Map([[1, 2]]), g: /x/g };
JSON.parse(JSON.stringify(o));
// { d: '1970-01-01T00:00:00.000Z', e: null, f: {}, g: {} }
```

```js
const a = { d: new Date(0), m: new Map([[1, { x: 1 }]]) };
a.self = a;
const b = structuredClone(a);
console.log(b.self === b);        // true，循环引用被正确还原
console.log(b.d instanceof Date); // true
structuredClone({ fn() {} });     // 抛出 DataCloneError
```

## 六、手写 deepClone（四步演进）

面试时按这个节奏写：先写最小版本，再主动说出它的缺陷，一步步补。

### 第 1 版：基础递归

```js
function deepClone(target) {
  if (target === null || typeof target !== 'object') return target;
  const result = Array.isArray(target) ? [] : {};
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      result[key] = deepClone(target[key]);
    }
  }
  return result;
}
```

缺陷：循环引用会栈溢出；Date、RegExp、Map、Set 会被拷成普通对象；Symbol 键丢失；原型丢失。

### 第 2 版：WeakMap 解决循环引用

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;
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
```

关键点：先 `map.set` 再递归，遇到循环引用时直接返回已创建的副本。

### 第 3 版：补充 Date、RegExp、Map、Set

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;
  if (map.has(target)) return map.get(target);

  if (target instanceof Date) return new Date(target);
  if (target instanceof RegExp) {
    const re = new RegExp(target.source, target.flags);
    re.lastIndex = target.lastIndex;
    return re;
  }
  if (target instanceof Map) {
    const result = new Map();
    map.set(target, result);
    target.forEach((v, k) => result.set(deepClone(k, map), deepClone(v, map)));
    return result;
  }
  if (target instanceof Set) {
    const result = new Set();
    map.set(target, result);
    target.forEach((v) => result.add(deepClone(v, map)));
    return result;
  }

  const result = Array.isArray(target) ? [] : {};
  map.set(target, result);
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      result[key] = deepClone(target[key], map);
    }
  }
  return result;
}
```

### 第 4 版：Symbol 键、原型、属性描述符

把最后的对象处理部分换成下面这段：

```js
  const result = Array.isArray(target)
    ? []
    : Object.create(Object.getPrototypeOf(target)); // 保留原型
  map.set(target, result);
  for (const key of Reflect.ownKeys(target)) {      // 含 Symbol 键和不可枚举属性
    const desc = Object.getOwnPropertyDescriptor(target, key);
    if ('value' in desc) desc.value = deepClone(desc.value, map);
    Object.defineProperty(result, key, desc);       // 保留 getter/setter 和属性特性
  }
  return result;
```

仍未覆盖：函数（按引用共享）、DOM 节点、Error、类型数组、ArrayBuffer、数组子类。面试时说出这些边界本身就是加分项。

### 补充：迭代版（避免递归栈溢出）

只演示思路，仅处理普通对象和数组：

```js
function deepCloneIter(root) {
  if (root === null || typeof root !== 'object') return root;
  const map = new WeakMap();
  const result = Array.isArray(root) ? [] : {};
  map.set(root, result);
  const stack = [[root, result]];
  while (stack.length) {
    const [src, dst] = stack.pop();
    for (const key of Reflect.ownKeys(src)) {
      const val = src[key];
      if (val !== null && typeof val === 'object') {
        if (!map.has(val)) {
          const copy = Array.isArray(val) ? [] : {};
          map.set(val, copy);
          stack.push([val, copy]);
        }
        dst[key] = map.get(val);
      } else {
        dst[key] = val;
      }
    }
  }
  return result;
}
```

## 七、高频面试题

**1. 赋值、浅拷贝、深拷贝有什么区别？** 

- 赋值只复制引用，两个变量指向同一个对象；
- **浅拷贝**新建第一层，嵌套引用仍共享；
- **深拷贝**递归新建所有层级。

**2. 展开运算符是深拷贝吗？** 

不是。它只拷贝第一层自有可枚举属性，嵌套的引用类型仍然共享。

**3. JSON.parse(JSON.stringify()) 有哪些坑？** 

见第五节表格。回答时按类别说：丢失（undefined、函数、Symbol）、失真（Date、NaN、Infinity、Map、Set、RegExp）、报错（循环引用、BigInt）、丢原型。

**4. structuredClone 能完全替代 lodash.cloneDeep 吗？** 

不能。它不能克隆函数（直接抛错），会丢原型和 Symbol 键；cloneDeep 保留原型和 Symbol 键，函数按引用保留。纯数据用 structuredClone 足够，含类实例或函数用 cloneDeep。

**5. 怎么解决循环引用？为什么用 WeakMap 而不是 Map？** 

用映射表记录「原对象 → 副本」，递归前先登记，再次遇到同一对象直接返回副本。WeakMap 的键是弱引用，不会阻止原对象被垃圾回收，拷贝结束后无需手动清理；Map 会强引用键，容易造成内存滞留。

**6. for...in、Object.keys、Reflect.ownKeys 有什么区别？** 

for...in 遍历自有加继承的可枚举字符串键，所以要配合 hasOwnProperty；Object.keys 只取自有可枚举字符串键；Reflect.ownKeys 取自有的全部键，包含不可枚举和 Symbol 键。

**7. 函数怎么拷贝？** 

通常直接共享引用，函数是不可变的行为单元，一般无需复制。强行用 `new Function(fn.toString())` 重建会丢失闭包，不推荐。

**8. 深拷贝有性能问题吗？React、Redux 里怎么避免？** 

大对象深拷贝开销高，而且会让所有子对象引用都变化，导致依赖引用比较的 memo、useEffect 依赖等全部失效。更合理的做法是不可变更新：只复制被修改路径上的节点，其余节点共享（结构共享）。可以手写展开，也可以用 Immer，它基于 Proxy 做写时复制，写法像直接修改，产出的是结构共享的新对象。

**9. 递归版会栈溢出吗？** 

会。嵌套层级极深时抛 RangeError，具体上限取决于引擎。解决办法是改成显式栈的迭代版，见第六节补充。

## 八、手写题评分点与加分项

**基本分：**

1. 处理 null 和原始值，不对 null 做 `typeof` 误判。
2. 区分数组和对象。
3. 用 WeakMap 处理循环引用，并且先登记再递归。

**加分项：**

1. 处理 Date、RegExp、Map、Set，并知道 RegExp 的 lastIndex。
2. 用 Reflect.ownKeys 保留 Symbol 键，用 Object.create 保留原型。
3. 用属性描述符保留 getter/setter。
4. 主动说出未覆盖的边界：函数、DOM、Error、类型数组、递归深度。
5. 工程上先考虑 structuredClone 或 lodash，而不是上来就手写；并能说明何时根本不需要深拷贝（不可变更新）。

## 九、速查表

| 场景 | 选择 |
| --- | --- |
| 只改第一层 | 展开运算符或 Object.assign |
| 纯 JSON 数据且不在意细节丢失 | JSON 方式（谨慎） |
| 纯数据、含 Date、Map、Set、循环引用 | structuredClone |
| 含类实例、Symbol 键、需保留原型 | lodash.cloneDeep |
| 状态更新（React、Redux） | 不可变更新或 Immer，避免整体深拷贝 |
| 面试手写 | WeakMap 版起步，按四步演进，并说明边界 |
