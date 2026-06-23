const test = require('node:test');
const assert = require('node:assert/strict');
const { mobileAuthSend } = require('../controllers/mobileAuth');

const runController = (controller, req) =>
    new Promise((resolve, reject) => {
        const res = {
            statusCode: null,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(payload) {
                this.body = payload;
                resolve(this);
            },
        };

        controller(req, res, reject);
    });

test('mobile auth send response includes the development auth code', async () => {
    const res = await runController(mobileAuthSend, {
        body: {
            mobile: '01012345678',
        },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.result, true);
    assert.equal(res.body.state, true);
    assert.equal(res.body.message, '인증번호가 전송되었습니다.\n인증코드는 111111입니다.');
});
