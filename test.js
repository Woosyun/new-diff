// const { run } = require('./myers_diff');
const { run } = require('./new_diff');

const testCases = ['add_1', 'delete_1', 'move_1'];

const samplePath = './samples/';
const originalsuffix = '.c';
const modifiedsuffix = '.c.m';

function test(fileName) {
    run(samplePath + fileName + originalsuffix, samplePath + fileName + modifiedsuffix);
    console.log('=======================');
}

function main(i, j) {
    for (let k = i; k < j; k++) {
        test(testCases[k]);
    }
}

main(0, testCases.length);