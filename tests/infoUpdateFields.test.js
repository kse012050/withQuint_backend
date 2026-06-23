const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInfoUpdateFields } = require('../controllers/infoUpdateFields');

test('builds update fields only for submitted profile values', async () => {
    const { keys, values } = await buildInfoUpdateFields({
        nickname: 'Nia',
        mobile: '01012345678',
    });

    assert.deepEqual(keys, ['nickname', 'mobile']);
    assert.deepEqual(values, ['Nia', '01012345678']);
});

test('hashes password and keeps omitted values out of update fields', async () => {
    const { keys, values } = await buildInfoUpdateFields({
        password: 'new-password',
        userId: 'should-not-update',
    });

    assert.deepEqual(keys, ['password']);
    assert.notEqual(values[0], 'new-password');
    assert.equal(await require('bcrypt').compare('new-password', values[0]), true);
});
