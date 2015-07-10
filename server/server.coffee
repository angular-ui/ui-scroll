module.exports = (app, dir) ->

  app.get '/', (req, res) ->
    res.render "#{dir}/index.html"
