'use strict';

module.exports = (head, params) => {
    head = '------------ ' + head + ' ------------';
    console.log(head);
    Object.keys(params).forEach(key => {
        console.log('-- ' + key + ': ', params[key]);
    });
    console.log('-'.repeat(head.length));
};