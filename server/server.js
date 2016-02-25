module.exports = function (app, dir) {
  return app.get('/', function (req, res) {
    return res.render(dir + "/index.html");
  });
};
