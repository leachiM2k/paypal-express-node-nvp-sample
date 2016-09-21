'use strict';

const Router    = require('express').Router;
const router = new Router();
const request = require('request');
const qs = require('querystring');
const objectPath = require('object-path');

const SampleCartModel = require('./sampleCart');
const paypal = require('./paypal-config');
const log = require('./lib/logging');

router.get('/', function(req, res) {
    res.render('index', { cart: SampleCartModel.cart, total: SampleCartModel.total.toFixed(2) });
});

router.get('/authorize', function(req, res) {
    var params = {
        METHOD: 'SetExpressCheckout',
        PAYMENTREQUEST_0_PAYMENTACTION: 'Authorization',
        PAYMENTREQUEST_0_AMT: SampleCartModel.total.toFixed(2),
        PAYMENTREQUEST_0_CURRENCYCODE: 'EUR',
        RETURNURL: 'http://ffe-local.fid-api.de:8484/payment-response/',
        CANCELURL: 'http://ffe-local.fid-api.de:8484/payment-aborted/',
        NOSHIPPING: 0,
        ADDROVERRIDE: 1,
        USER: paypal.user,
        PWD: paypal.pass,
        SIGNATURE: paypal.signature,
        VERSION: paypal.version
    };

    SampleCartModel.cart.forEach((item, index) => {
        params['L_PAYMENTREQUEST_0_NAME' + index] = item.name;
        params['L_PAYMENTREQUEST_0_AMT' + index] = item.amount;
    });

    log('Sending request to Paypal', {URL: paypal.url, Query: qs.stringify(params)});

    request.get({url: paypal.url, qs: params}, (err, result, body) => {
        var parsedBody = qs.parse(body);
        log('Received response from to Paypal', {err: err, body: parsedBody});
        
        if(err || !parsedBody.ACK || parsedBody.ACK !== 'Success') {
            return res.redirect('/error/?'+body);
        }

        res.redirect(paypal.webscr.replace(':token:', parsedBody.TOKEN));
    });
});

router.get('/error/', function(req, res) {
    res.render('error', {data: JSON.stringify( req.query )});
});

router.get('/payment-aborted/', function(req, res) {
    res.render('payment-aborted', { token: req.query.token });
});

router.get('/payment-response/', function(req, res) {
    console.log('++++++ Response received. ++++');

    if(!req.query.token) {
        return res.redirect('/error/?err=Missing+response+token+from+PayPal.');
    }

    if(req.query.payerID) {
        console.log('++++++ Got payerID ' + req.query.payerID + ' (enabled to complete order without any other page) ++++');
    }

    var params = {
        METHOD: 'GetExpressCheckoutDetails',
        TOKEN: req.query.token,
        USER: paypal.user,
        PWD: paypal.pass,
        SIGNATURE: paypal.signature,
        VERSION: paypal.version
    };

    log('Sending request to Paypal', {URL: paypal.url, Query: qs.stringify(params)});

    request.get({url: paypal.url, qs: params}, (err, result, body) => {
        var parsedBody = qs.parse(body);
        log('Received response from to Paypal', {err: err, body: parsedBody});
        
        if(err || !parsedBody.ACK || parsedBody.ACK !== 'Success') {
            return res.redirect('/error/?'+body);
        }

        var parsedX = parseExpressCheckoutDetails(parsedBody);
        res.render('confirmation', {
            token: parsedX.token,
            payerID: parsedX.payerid,
            paypalData: parsedX.paymentrequest,
            cart: SampleCartModel.cart
        });
    });
});

router.get('/payment-complete/', function(req, res) {
    if(!req.query.token || !req.query.payerID) {
        return res.redirect('/error/?err=Missing+token.');
    }

    console.log('++++++ Authorizing... ++++');

    var params = {
        METHOD: 'DoExpressCheckoutPayment',
        TOKEN: req.query.token,
        PAYERID: req.query.payerID,
        PAYMENTREQUEST_0_PAYMENTACTION: 'Sale',
        PAYMENTREQUEST_0_AMT: SampleCartModel.total.toFixed(2),
        PAYMENTREQUEST_0_CURRENCYCODE: 'EUR',
        USER: paypal.user,
        PWD: paypal.pass,
        SIGNATURE: paypal.signature,
        VERSION: paypal.version
    };

    log('Sending request to Paypal', {URL: paypal.url, Query: qs.stringify(params)});

    request.get({url: paypal.url, qs: params}, (err, result, body) => {
        var parsedBody = qs.parse(body);
        log('Received response from to Paypal', {err: err, body: parsedBody});
        
        if(err || !parsedBody.ACK || parsedBody.ACK !== 'Success') {
            return res.redirect('/error/?'+body);
        }

        res.render('payment-completed');
    });
});

function parseExpressCheckoutDetails(details) {
    if(!details) {
        return;
    }

    var parsed = {};
    Object.keys(details).forEach(key => {
        let path = key.toLowerCase().replace(/_/g, '.');
        objectPath.set(parsed, path, details[key]);
    });

    return parsed;
}

module.exports = router;