const { diff } = require('./myers_diff');

const move_1 = 'samples/move_1.c';
const move_1_m = 'samples/move_1.c.m';

diff(move_1, move_1_m);
console.log('=======================');

const add_1 = 'samples/add_1.c';
const add_1_m = 'samples/add_1.c.m';

diff(add_1, add_1_m);
console.log('=======================');

const delete_1 = 'samples/delete_1.c';
const delete_1_m = 'samples/delete_1.c.m';

diff(delete_1, delete_1_m);