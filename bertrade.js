// Source: https://github.com/chartjs/Chart.Zoom.js/blob/master/samples/zoom.html
var randomColor = function(opacity) {
    return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')';
};

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
        success: function(stocks_response) {
          stocks = _.sortBy(stocks_response.stocks, 'local_ticker');
          context.stocks = stocks;
        }
      });
    });

    this.get('#/', function(context) {
      context.app.swap('');
      $.each(context.stocks, function(i, stock) {
        if(stock.name.length > 32) {
          stock.name = stock.name.slice(0, 28) + '...'
        }
        context.partial('templates/stock.template', {id: i, stock: stock}, function(rendered) {
          context.$element().append(rendered);
          $('html,body').scrollTop(0);
        });
      });
    });

    this.get('#/stock/:local_ticker', function(context) {
      self = this;
      // function findStock()
      foundStock = false;
      self.stocks.forEach( function(stock){
        if(stock.local_ticker == self.params['local_ticker']) {
          foundStock = stock;
          startDate = new Date().getFullYear() + '-01-01';
          endDate = new Date().getFullYear() + '-12-31';
          getStock({ stock: stock.yahoo_ticker, startDate: startDate, endDate: endDate }, 'historicaldata', function(err, data) {
              stock.historical_data = data;
              if (!foundStock) { return this.notFound(); } else { this.stock = foundStock }
              self.partial('templates/stock_detail.template');
              $('html,body').scrollTop(0);

              // Table with prices, Volume
              self.trigger('renderTickerInfoTable', data);

              // We got data from Yahoo, build and render charts
              data.labels = [];
              data.open = [];
              data.close = [];
              data.adj_close = [];
              data.high = [];
              data.low = [];

              data.quote = _.sortBy(data.quote, 'Date');
              data.quote.forEach(function(dayInfo){
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

              chartData.datasets.forEach(function(dataset) {
                  dataset.borderColor = randomColor(0.4);
                  dataset.pointBorderColor = randomColor(0.7);
                  dataset.pointBackgroundColor = randomColor(0.5);
                  dataset.pointBorderWidth = 1;
                  dataset.fill = false;
              });

              self.trigger('renderCharts', chartData);
          });
        }
      })
    });


    this.bind('renderTickerInfoTable', function(e, historicalData) {
      function renderTickerInfoTable(historicalData) {
        var tableHtml = '';
        historicalData.quote.forEach(function(dayInfo) {
          tableHtml += '<tr>';
          tableHtml += '<td>'+ dayInfo.Date +'</td>';
          tableHtml += '<td>'+ dayInfo.Open +'</td>';
          tableHtml += '<td>'+ dayInfo.Close +'</td>';
          tableHtml += '<td>'+ dayInfo.Adj_Close +'</td>';
          tableHtml += '<td>'+ dayInfo.High +'</td>';
          tableHtml += '<td>'+ dayInfo.Low +'</td>';
          tableHtml += '<td>'+ dayInfo.Volume +'</td>';
          tableHtml += '</tr>';
        });
        $('#historical-data').append(tableHtml);
      }

      setTimeout(renderTickerInfoTable, 2000, historicalData);
    });

    this.bind('renderCharts', function(e, chartData) {
      function renderCharts(chartData) {
        var chartOptions = {
          scaleShowGridLines: true,
          scaleGridLineColor: "rgba(0,0,0,.05)",
          scaleGridLineWidth: 1,
          scaleShowHorizontalLines: true,
          scaleShowVerticalLines: true,
          responsive: true,
          maintainAspectRatio: false,
          pan: {
              enabled: true,
              mode: 'xy'
          },
          zoom: {
              enabled: true,
              mode: 'xy'
          },
          scales: {
              xAxes: [{
                  type: 'time'
              }],
              yAxes: [{
                  type: 'linear'
              }]
          }
        };
        var lineChartCanvas = $("#lineChart").get(0).getContext("2d");
        var lineChart = Chart.Line(lineChartCanvas, {data: chartData, options: chartOptions})
      }

      setTimeout(renderCharts, 2000, chartData);
    });
  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
