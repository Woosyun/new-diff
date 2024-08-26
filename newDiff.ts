import fs from 'fs'

const loadFile = (path: string): string => {
  return fs.readFileSync(path, 'utf-8');
}

class Diagonals {
  mid: number;
  diagonals: Array<number>;

  constructor(xLen: number, yLen: number, fill: number) {
    this.mid = yLen + 1;
    this.diagonals = new Array<number>(2 * (xLen + yLen) + 1).fill(fill);
  }

  get(idx: number): number {
    return this.diagonals[this.mid + idx];
  }
  set(idx: number, value: number): void {
    this.diagonals[this.mid + idx] = value;
  }
}

type Node = {
  label: string;
  index: number;
  type: 'function' | 'line';
  children: Node[];
};
type Line = {
  label: string;
  index: number;
};

const fnRegex = /\b\w+\s+\w+\s*\([void | \w+\s\w*,\s*]*\)\s*\{\B/;

function parse(file: string): Line[] {
  const lines: Line[] = file.split('\n').map((content: string, idx: number) => ({ label: content, index: idx }));
  return lines;
}
function getNodes(lines: Line[]): Node[] {
  try {
    const re: Node[] = [];
    
    let idx: number = 0;
    while (idx < lines.length) {
      const label: string = lines[idx].label;
      if (fnRegex.test(label)) {
        let len: number = 1;
        let count: number = 1;

        while (count > 0) {
          if (lines[idx + len].label.includes('{')) {
            count++;
          }
          if (lines[idx + len].label.includes('}')) {
            count--;
          }
          len++;
        }

        re.push({
          label: label,
          index: re.length,
          type: 'function',
          children: getNodes(lines.slice(idx + 1, idx + len))
        });

        idx += len;
      } else {
        re.push({
          label: label,
          index: re.length,
          type: 'line',
          children: []
        });

        idx++;
      }
    }

    return re;
  } catch (error: any) {
    throw new Error('(parse)->' + error.message);
  }
}

type Snake = {
  x: number | null;
  y: number | null;
  u: number | null;
  v: number | null;
}

function findMiddleSnake(A: Node[], N: number, B: Node[], M: number): Snake {
  const delta: number = N - M;
  const odd: boolean = delta % 2 === 1;

  let VForward = new Diagonals(N, M, 0);
  let VReverse = new Diagonals(N, M, N);
  let x: number, y: number, u: number, v: number;
  let result: Snake = {
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

      if (x < u && y < v) {//if length of snake is greater than 0
        result = { x, y, u, v };
        // console.log(`(findMiddleSnake) snake is updated to x: ${x} y: ${y} u: ${u} v: ${v}`);
      }
      if (odd && delta - D < k && k < delta + D) {
        if (u >= VReverse.get(k))
          return result;
      }
        
    }

    for (let k = -D; k <= D; k += 2) {
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
      if (x < u && y < v) {
        result = { x, y, u, v };
        // console.log(`(findMiddleSnake) snake is updated to x: ${x} y: ${y} u: ${u} v: ${v}`);
      }

      // console.log(`x: ${x}, y: ${y}, u: ${u}, v: ${v}`);
      if (!odd && -D <= tempD && tempD <= D) {
        if (x <= VForward.get(tempD))
          return result;
      }
    }
  }

  return result;
}

function topDown(A: Node[], B: Node[], m: Map<number, number>) {
  const N = A.length;
  const M = B.length;

  if (N > 0 && M > 0) {
    const snake: Snake = findMiddleSnake(A, N, B, M);

    if (snake.x != null) {
      const [x, y, u, v]: number[] = [snake.x!, snake.y!, snake.u! - 1, snake.v! - 1];
      // console.log(`x: ${x}, y: ${y}, u: ${u}, v: ${v}`);
      
      topDown(A.slice(0, x), B.slice(0, y), m);
        
      for (let i = 0; i < u - x + 1; i++)
        m.set(A[x + i].index, B[y + i].index);

      topDown(A.slice(u + 1, A.length), B.slice(v + 1, B.length), m);
    }
  }
}

type RecoveryMap = Map<number, Map<number, number>>;

function recovery(A: Node[], B: Node[], m: Map<number, number>): RecoveryMap {
  const re: RecoveryMap = new Map();

  const restFnArrayFromA = A.filter((node: Node) => !m.has(node.index) && node.type === 'function');

  const reversedM = new Map<number, number>(Array.from(m).map(([key, value]) => [value, key]));
  const restFnArrayFromB = B.filter((node: Node) => !reversedM.has(node.index) && node.type === 'function');
  const restFnMap = new Map<string, Node>(restFnArrayFromB.map((node: Node) => [node.label, node]));

  restFnArrayFromA.forEach((node: Node) => {
    if (restFnMap.has(node.label)) {
      const topDownMapping = new Map<number, number>();
      topDown(node.children, restFnMap.get(node.label)!.children, topDownMapping);
      re.set(node.index, topDownMapping);
    }
  });
  
  return re;
}

function diff(from: string, to: string): [Map<number, number>, RecoveryMap] {
  
  const A = getNodes(parse(from));
  const B = getNodes(parse(to));
  const topDownMapping = new Map<number, number>();
  topDown(A, B, topDownMapping);

  const recoverdM = recovery(A, B, topDownMapping);

  return [topDownMapping, recoverdM]
}

export function run(from: string, to: string): void {
  const A = getNodes(parse(loadFile(from)));
  const B = getNodes(parse(loadFile(to)));

  // console.log('A is ', JSON.stringify(A, null, 2));
  // console.log('B is ', JSON.stringify(B, null, 2));

  const topDownMapping = new Map<number, number>();
  topDown(A, B, topDownMapping);

  console.log('Top Down Mapping is ', topDownMapping);

  const recoverdM = recovery(A, B, topDownMapping);

  for (const [fromIdx, toIdx] of topDownMapping) {
    console.log(`${JSON.stringify(A[fromIdx], null, 2)} is same in ${fromIdx}th from before and ${toIdx}th from after`);
  }

  console.log('Recovered Mapping is ', recoverdM);
  
  for (const [fnIdx, mapping] of recoverdM) {
    console.log(`Function ${A[fnIdx]} is detected and skipped in topdown phase in both files`);
    for (const [fromIdx, toIdx] of mapping) {
      console.log(`${JSON.stringify(A[fnIdx].children[fromIdx], null, 2)} is same in ${fromIdx}th from before and ${toIdx}th from after`);
    }
  }
}