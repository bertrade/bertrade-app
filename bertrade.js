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
      local_ticker = this.params['local_ticker']
      foundStock = false;
      this.stocks.forEach( function(stock, index){
        if(stock.local_ticker == local_ticker) {
          foundStock = stock;
        }
      })
      console.log(foundStock);
      if (!foundStock) { return this.notFound(); } else { this.stock = foundStock }
      this.partial('templates/stock_detail.template');
    });

  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
