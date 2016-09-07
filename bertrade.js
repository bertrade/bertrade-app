(function($) {

  var app = $.sammy(function() {
    this.element_selector = '#main';
    this.use(Sammy.Template);

    this.before(function() {
      var context = this;
      $.ajax({
        url: 'data/stocks.js',
        dataType: 'json',
        async: false,
        success: function(stocks) {
          context.stocks = stocks.stocks;
        }
      });
    });

    this.get('#/', function(context) {
      context.app.swap('');
      $.each(context.stocks, function(i, stock) {
        if(stock.name.length > 40) {
          stock.name = stock.name.slice(0, 36) + '...'
        }
        context.partial('templates/stock.template', {id: i, stock: stock}, function(rendered) {
          context.$element().append(rendered);
        });
      });
    });

    this.get('#/stock/:local_ticker', function(context) {
      self = this;
      foundStock = false;
      self.stocks.forEach( function(stock, index){
        if(stock.local_ticker == self.params['local_ticker']) {
          foundStock = stock;
          getStock({ stock: stock.yahoo_ticker, startDate: '2016-01-01', endDate: '2016-01-05' }, 'historicaldata', function(err, data) {
              console.log(data);
              if (!foundStock) { return this.notFound(); } else { this.stock = foundStock }
              self.partial('templates/stock_detail.template');
          });
        }
      })
    });
  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
