const { run: runMyersDiff } = require('./myers_diff_deprecated');
const { run: runNewDiff } = require('./new_diff');

const testCases = ['add_1.c', 'delete_1.c', 'move_1.c', 'move_fn_1.c'];

const samplePath = './samples/';
const modifiedsuffix = '.m';

function test(fileName) {
  runMyersDiff(samplePath + fileName, samplePath + fileName + modifiedsuffix);
  console.log('-----------------------');
  // runNewDiff(samplePath + fileName, samplePath + fileName + modifiedsuffix);
  // console.log('=======================');
}

function main(i, j) {
    for (let k = i; k < j; k++) {
        test(testCases[k]);
    }
}

main(3, 4);
// main(0, testCases.length);