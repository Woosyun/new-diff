import { run } from './newDiff';

const testCases = ['add_1.c', 'delete_1.c', 'move_1.c', 'move_fn_1.c'];

const samplePath = './samples/';
const modifiedsuffix = '.m';

function test(fileName: string) {
  run(samplePath + fileName, samplePath + fileName + modifiedsuffix);
  console.log('=======================');
}

function main(i: number, j: number) {
  for (let k = i; k < j; k++) {
      test(testCases[k]);
  }
}

main(3, 4);
// main(0, testCases.length);