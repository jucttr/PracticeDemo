// 手写实现内置工具类型：Partial / Pick / Omit / ReturnType
// 不借用 lib 里现成的工具类型，所以 Omit 依赖的 Exclude 也一并手写

// ---------- Partial：把 T 的每个属性变成可选 ----------
// [P in keyof T] 是同态映射，会自动保留原属性的 readonly 等修饰符
type myPartial<T> = {
    [P in keyof T]?: T[P];
};

// ---------- Pick：只保留 K 中的键 ----------
// K extends keyof T 保证只能挑 T 上真实存在的键
type myPick<T, K extends keyof T> = {
    [P in K]: T[P];
};

// ---------- Exclude：从联合类型 T 中剔除可赋值给 U 的成员 ----------
// T 是裸类型参数，会触发分布式条件类型：联合里的每个成员分别判断
// 结果为 never 的成员会在联合类型中被自动消掉
type myExclude<T, U> = T extends U ? never : T;

// ---------- Omit：删掉 K 中的键 ----------
// 反过来做 Pick：先算出剩下的键，再按这些键取类型
type myOmit<T, K extends keyof any> = myPick<T, myExclude<keyof T, K>>;

// K 约束为 keyof any（string | number | symbol）而不是 keyof T：
// 允许传入 T 上并不存在的键而不报错，这和内置 Omit 的行为一致
// 等价写法（TS 4.1+ 的 as 键重映射，一步完成）：
// type myOmit<T, K extends keyof any> = {
//     [P in keyof T as P extends K ? never : P]: T[P];
// };

// ---------- ReturnType：取出函数类型的返回值类型 ----------
// infer R 让编译器把返回值类型推断出来，只能写在 extends 条件类型里
// 约束用 (...args: any) 而不是 unknown[]：参数位置是逆变的，any 才能匹配任意函数
// 边界：重载函数只能拿到最后一个重载签名的返回值类型
type myReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

// ---------- 使用示例（每个类型下面跟一段接近真实业务的代码）----------
interface DemoUser {
    readonly id: number;
    name: string;
    age: number;
}

const currentUser: DemoUser = { id: 1, name: 'tom', age: 18 };

// 1) Partial：PATCH /users/:id 只提交要改的字段，没传的沿用原值
type UserPatch = myPartial<DemoUser>; // { readonly id?: number; name?: string; age?: number }
// 大白话：Partial 就是「不用给全」—— 用户原本有 id、name、age 三样，这回想改哪样就只带哪样，没带的一律沿用原值。

function updateUser(patch: UserPatch): DemoUser {
    return { ...currentUser, ...patch };
}
const renamed = updateUser({ name: 'jerry' });
const corrected = updateUser({ name: 'jerry', age: 19 });
// updateUser({ email: 'x@x.com' }); // 报错：对象字面量里不存在 email

// ==============================================================================================================================

// 2) Pick：列表行组件只需要 id 和 name，不该依赖完整的用户对象
type UserBrief = myPick<DemoUser, 'id' | 'name'>; // { readonly id: number; name: string }
// 大白话：Pick 就像从整张表里只圈要用的那几列 —— 列表行用不上 age，于是把 id、name 拎出来另立一个小类型。

function renderUserRow(row: UserBrief): string {
    return `${row.id} | ${row.name}`;
}
renderUserRow(currentUser); // 传完整对象也行：变量不做多余属性检查
renderUserRow({ id: 2, name: 'lucy' }); // 只构造必要字段
// renderUserRow({ id: 2, name: 'lucy', age: 20 }); // 报错：字面量多传了 age

// ==============================================================================================================================

// 3) Omit：新建用户时 id 由服务端生成，接口入参不该带 id
type UserNoId = myOmit<DemoUser, 'id'>; // { name: string; age: number }
// 大白话：Omit 是反着来的「把不要的划掉」—— id 由后端发号，前端建用户时别自己填，划掉它就只剩 name、age 要传。

function createUser(input: UserNoId): DemoUser {
    return { id: Date.now(), ...input };
}
const created = createUser({ name: 'lucy', age: 20 });
// createUser({ id: 3, name: 'lucy', age: 20 }); // 报错：入参里不该出现 id

// ==============================================================================================================================

// 4) ReturnType：配置由函数生成，别处复用这份结构，不用再手写一遍类型
function getTableConfig() {
    return {
        pageSize: 20,
        columns: ['name', 'age'],
        showIndex: true,
    };
}
type TableConfig = myReturnType<typeof getTableConfig>;
// { pageSize: number; columns: string[]; showIndex: boolean }
// 大白话：ReturnType 就是「函数吐出什么，就拿什么当类型」—— 那坨配置长啥样，TableConfig 就长啥样，以后函数改了它自动跟着变，不用人再写第二遍。

const adminConfig: TableConfig = getTableConfig();
adminConfig.pageSize = 50;

// 常见坑：async 函数取到的是 Promise<X>，不是解包后的 X
declare function fetchDemoUser(id: number): Promise<DemoUser>;
type FetchResult = myReturnType<typeof fetchDemoUser>; // Promise<DemoUser>
// 大白话：同一个 ReturnType 碰上 async 函数，拿到的是张「还没兑现的欠条」（Promise）—— 所以是 Promise<DemoUser>，还不是用户数据本身。

const userCache = new Map<number, FetchResult>();
userCache.set(1, Promise.resolve(currentUser));
