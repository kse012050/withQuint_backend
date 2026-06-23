const bcrypt = require('bcrypt');

const updatableFields = ['password', 'nickname', 'mobile'];

const buildInfoUpdateFields = async(body) => {
    const keys = [];
    const values = [];

    for (const field of updatableFields) {
        const value = body[field];

        if(value === undefined || value === null || value === '') {
            continue;
        }

        keys.push(field);
        values.push(field === 'password' ? await bcrypt.hash(value, 12) : value);
    }

    return { keys, values };
}

module.exports = { buildInfoUpdateFields };
