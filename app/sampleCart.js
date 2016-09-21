'use strict';

var SampleCartModel = {
    cart: [
        {
            name: 'Jeans',
            amount: 29.90
        },
        {
            name: 'Bluse',
            amount: 19.90
        },
        {
            name: 'Hut',
            amount: 9.90
        }
    ]
};

SampleCartModel.total = SampleCartModel.cart.reduce((prev, act) => prev + act.amount, 0);

module.exports = SampleCartModel;