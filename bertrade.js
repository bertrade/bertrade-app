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
          $('html,body').scrollTop(0);
        });
      });
    });

    this.bind('renderCharts', function(e, chartData){
      function renderCharts(chartData){
        var chartOptions = {
          scaleShowGridLines: true,
          scaleGridLineColor: "rgba(0,0,0,.05)",
          scaleGridLineWidth: 1,
          scaleShowHorizontalLines: true,
          scaleShowVerticalLines: true,
          datasetStroke: true,
          datasetStrokeWidth: 2,
          legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
          maintainAspectRatio: true,
          responsive: true,
          pan: {
              enabled: true,
              mode: 'xy'
          },
          zoom: {
              enabled: true,
              mode: 'xy',
              limits: {
                  max: 10,
                  min: 0.5
              }
          }
        };
        var lineChartCanvas = $("#lineChart").get(0).getContext("2d");
        var lineChart = Chart.Line(lineChartCanvas, {data: chartData, options: chartOptions})
      }

      setTimeout(renderCharts, 2000, chartData);
    });

    this.get('#/stock/:local_ticker', function(context) {
      self = this;
      foundStock = false;
      self.stocks.forEach( function(stock, index){
        if(stock.local_ticker == self.params['local_ticker']) {
          foundStock = stock;
          startDate = new Date().getFullYear() + '-01-01';
          endDate = new Date().getFullYear() + '-12-31';
          getStock({ stock: stock.yahoo_ticker, startDate: startDate, endDate: endDate }, 'historicaldata', function(err, data) {
              stock.historical_data = data;
              if (!foundStock) { return this.notFound(); } else { this.stock = foundStock }
              self.partial('templates/stock_detail.template');
              $('html,body').scrollTop(0);


              // We got data from Yahoo, build and render charts
              data.labels = [];
              data.open = [];
              data.close = [];
              data.adj_close = [];
              data.high = [];
              data.low = [];

              data.quote = _.sortBy(data.quote, 'Date');
              data.quote.forEach(function(dayInfo, index){
                data.labels.push(dayInfo.Date);
                data.open.push(dayInfo.Open);
                data.close.push(dayInfo.Close);
                data.adj_close.push(dayInfo.Adj_Close);
                data.high.push(dayInfo.High);
                data.low.push(dayInfo.Low);
              })

              var chartData = {
                labels: data.labels,
                datasets: [
                  {
                    label: "Open",
                    data: data.open
                  },
                  {
                    label: "Close",
                    data: data.close
                  },
                  {
                    label: "Adj Close",
                    data: data.adj_close
                  },
                  {
                    label: "High",
                    data: data.high
                  },
                  {
                    label: "Low",
                    data: data.low
                  }
                ]
              };
              self.trigger('renderCharts', chartData);
          });
        }
      })
    });
  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
