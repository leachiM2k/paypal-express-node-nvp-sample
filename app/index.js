'use strict';

var express = require('express');
var exphbs = require('express-handlebars');
var app = express();

app.set('port', process.env.PORT || 8484);
app.set('env',  process.env.NODE_ENV || 'development');
app.disable('x-powered-by');

app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.listen(app.get('port'), function() {
    console.log('Example app listening on port ' + app.get('port') + '!');
});

app.use('/', require('./routes'));

app.use(function(err, req, res) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});