const fs = require('fs');

function loadFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data;
    } catch (error) {
        console.log(error);
    }
}
function reverseMap(m) {
    const newMap = new Map();
    m.forEach((value, key) => newMap.set(value, key));
    return newMap;
}

class Diagonals {
    constructor(xLen, yLen, fill) {
        this.mid = yLen + 1;
        this.diagonals = new Array(2*(xLen + yLen) + 1).fill(fill);
    }
    get(idx) {
        return this.diagonals[this.mid + idx];
    }
    set(idx, val) {
        this.diagonals[this.mid + idx] = val;
    }
}

//1. parse
function parseC(lines) {
    const regex = /\b\w+\s+\w+\s*\([void | \w+\s\w*,\s*]*\)\s*\{\B/;

    let root = {
        type: 'root',
        children: []
    };
    function makeNode(idx, type, lable) {
        return {
            index: idx,
            type: type,
            label: lable,
            children: []
        };
    }
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (regex.test(line)) { // function definition found!!
            let functionNode = makeNode(i, 'function', line);
            let count = 1;
            i++;
            while (count > 0) {
                const line = lines[i];
                functionNode.children.push(makeNode(i, 'line', line));
                if (line.includes('{'))
                    count++;
                if (line.includes('}'))
                    count--;
                i++;
            }
            root.children.push(functionNode);
        } else {
            root.children.push(makeNode(i, 'line', line));
            i++;
        }
    }

    return root;
}

//2. top down, returns mapping
function findMiddleSnake(A, N, B, M) {
    const delta = N - M;
    const odd = delta % 2 === 1;

    let VForward = new Diagonals(N, M, 0);
    let VReverse = new Diagonals(N, M, N);
    let x, y, u, v;
    let result = {
        x: null,
        y: null,
        u: null,
        v: null
    };
    for (let D = 0; D <= Math.ceil((M + N) / 2); D++) {
        for (let k = -D; k <= D; k += 2) {
            //1. find end of furthest reaching forward D-path in diagonal k
            if (k === -D || (k !== D && VForward.get(k + 1) > VForward.get(k - 1)))
                u = VForward.get(k + 1);
            else
                u = VForward.get(k - 1) + 1;
            v = u - k;
            x = u;
            y = v;

            while (u < N && v < M && A[u].label === B[v].label) {
                u++;
                v++;
            }
            VForward.set(k, u);

            if (x < u && y < v)//if length of snake is greater than 0
                result = { x, y, u, v };
            if (odd && delta - D < k && k < delta + D) {
                if (u >= VReverse.get(k))
                    return result;
            }
            
            // console.log('snake is ', result);
        }

        for (let k = -D; k <= D; k += 2 ) {    
            //2. find end of furthest reaching reverse D-path in diagonal k+delta
            const tempD = k + delta;
            if (k === D || (k !== -D && VReverse.get(tempD - 1) < VReverse.get(tempD + 1)))
                x = VReverse.get(tempD - 1);
            else
                x = VReverse.get(tempD + 1) - 1;
            y = x - tempD;
            u = x;
            v = y;

            while (x > 0 && y > 0 && A[x - 1].label === B[y - 1].label) {
                x--;
                y--;
            }
            VReverse.set(tempD, x);
            if (x < u && y < v)
                result = { x, y, u, v };

            // console.log(`x: ${x}, y: ${y}, u: ${u}, v: ${v}`);
            if (!odd && -D <= tempD && tempD <= D) {
                if (x <= VForward.get(tempD))
                    return result;
            }

        }
    }
}
function printLines(A, x, u, B, y, v) {
    console.log('A: ', A);
    console.log('B: ', B);
    console.log(`x: ${x}, u: ${u}, y: ${y}, v: ${v}`);
    console.log('----------------------');
    A.slice(0, x).forEach((line) => console.log(line.label));
    B.slice(0, y).forEach((line) => console.log(line.label));
    console.log('----------------------');
    A.slice(x, u + 1).forEach((line) => console.log(line.label));
    B.slice(y, v + 1).forEach((line) => console.log(line.label));
    console.log('----------------------');
    A.slice(u + 1, A.length).forEach((line) => console.log(line.label));
    B.slice(v + 1, B.length).forEach((line) => console.log(line.label));
    console.log('=======================');
}
function topDown(A, B) {
    const N = A.length;
    const M = B.length;

    if (N > 0 && M > 0) {
        const snake = findMiddleSnake(A, N, B, M);
        const x = snake.x, y = snake.y, u = snake.u - 1, v = snake.v - 1;
        // printLines(A, x, u, B, y, v);

        if (x != null) {
            const mapping = topDown(A.slice(0, x), B.slice(0, y));
            
            for (let i = 0; i < u - x + 1; i++)
                mapping.set(A[x + i].index, B[y + i].index);

            const mapping2 = topDown(A.slice(u + 1, A.length), B.slice(v + 1, B.length));
            mapping2.forEach((to, from) => {
                mapping.set(from, to);
            });

            // console.log('resulted mapping is ', mapping);
            
            return mapping;
        }
    }
    return new Map();
}


//3. recovery
function recovery(A, B, mapping) {
    const reversedMapping = reverseMap(mapping);
    
    const restA = A.children.filter((line) => !mapping.has(line.index));
    const restB = B.children.filter((line) => !reversedMapping.has(line.index));

    // console.log('restA: ', restA);
    // console.log('restB: ', restB);

    function findMatch(lineA) {
        for (let lineB of restB)
            if (lineA.label === lineB.label)
                return lineB.index;
        return null;
    }
    
    const newMap = new Map();
    restA.forEach((line) => {
        const idx = findMatch(line);
        if (idx !== null)
            newMap.set(line.index, idx);
    })

    return newMap;
}

//4. top down for functions
function topDown2(A, B, mapping) {
    const functionMapping = new Map();
    mapping.forEach((to, from) => {
        if (A[from].type === 'function') { //B[to].type === 'function'이 보장된다?
            const mapping = topDown(A[from].children, B[to].children);
            // const moveMapping = recovery(A[from], B[to], mapping);
            // moveMapping.forEach((to, from) => mapping.set(from, to));

            functionMapping.set(A[from].index, mapping);
        }
    })

    return functionMapping;
}
//4. create edit script

//for debug
function printTree(root) {
    root.children.forEach((tree) => {
        if (tree.type === 'function') {
            console.log(tree.index, ' ', tree.label);
            tree.children.forEach((line) => {
                console.log(line.index, ' ', line.label);
            });
        } else {
            console.log(tree.index, ' ', tree.label);
        }
    })
}
function printResult(A, B, mapping, functionMapping) {
    let a = 0, b = 0;
    mapping.forEach((to, from) => {
        while (A[a].index < from) {
            console.log('-', A[a].label);
            if (A[a].type === 'function')
                A[a].children.forEach((line) => console.log('-', line.label));
            a++;
        }
        while (B[b].index < to) {
            console.log('+', B[b].label);
            if (B[b].type === 'function')
                B[b].children.forEach((line) => console.log('+', line.label));
            b++;
        }
        console.log(' ', A[a].label);
        if (A[a].type === 'function')
            printResult(A[a].children, B[b].children, functionMapping.get(A[a].index, null));
        a++;
        b++;
    })
    while (a < A.length) {
        console.log('-', A[a].label);
        if (A[a].type === 'function')
            A[a].children.forEach((line) => console.log('-', line.label));
        a++;
    }
    while (b < B.length) {
        console.log('+', B[b].label);
        B[b].children.forEach((line) => console.log('+', line.label));
        b++;
    }
}

function run(file1Path, file2Path) {
    const file1 = loadFile(file1Path);
    const file2 = loadFile(file2Path);

    const treeA = parseC(file1.split('\n'));
    const treeB = parseC(file2.split('\n'));

    // printTree(treeA);
    // console.log('===================');
    // printTree(treeB);

    const mapping = topDown(treeA.children, treeB.children);

    // const moveMapping = recovery(treeA, treeB, mapping);
    // moveMapping.forEach((to, from) => mapping.set(from, to));

    //mapping for functions
    const functionMapping = topDown2(treeA.children, treeB.children, mapping);

    //output
    // console.log('mapping is ', mapping);
    // console.log('move mapping is ', moveMapping);
    // console.log('function mapping is ', functionMapping);
    printResult(treeA.children, treeB.children, mapping, functionMapping);
}

module.exports = { run };