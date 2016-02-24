module.exports = function (connect, options) {
  var app, express, routes;
  express = require('express');
  routes = require('./server');
  app = express();
  app.configure(function () {
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.errorHandler());
    app.use(express["static"](options.base[0]));
    app.use(app.router);
    return routes(app, options);
  });
  return [connect(app)];
};
