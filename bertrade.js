// Source: https://github.com/chartjs/Chart.Zoom.js/blob/master/samples/zoom.html
var randomColor = function(opacity) {
    return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')';
};

$('#search-btn').click(function(){
  var ticker = $('#search-ticker-input').val().toUpperCase();
  window.location.href = '#/stock/' + ticker;
  return false;
});

(function($) {
    var app = $.sammy(function() {
        this.element_selector = '#main';
        this.use(Sammy.Template);

        this.before(function() {
            var context = this;
            $.ajax({
                // stocks.js contains the database with companies
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
                // Triming with ... large texts so they fit smoothly on grid
                if (stock.name.length > 32) {
                    stock.name = stock.name.slice(0, 28) + '...'
                }
                context.partial('templates/stock.template', {
                    id: i,
                    stock: stock
                }, function(rendered) {
                    context.$element().append(rendered);
                    $('html,body').scrollTop(0);
                });
            });
        });

        this.get('#/stock/:local_ticker', function(context) {
            self = this;
            // @todo: Refactor to function findStock()
            foundStock = false;
            self.stocks.forEach(function(stock) {
                if (stock.local_ticker == self.params['local_ticker']) {
                    foundStock = stock;
                    // Current year whole year is used for Yahoo API
                    startDate = new Date().getFullYear() + '-01-01';
                    endDate = new Date().getFullYear() + '-12-31';
                    getStock({
                        stock: stock.yahoo_ticker,
                        startDate: startDate,
                        endDate: endDate
                    }, 'historicaldata', function(err, data) {
                        stock.historical_data = data;
                        if (!foundStock) {
                            return this.notFound();
                        } else {
                            this.stock = foundStock
                        }
                        self.partial('templates/stock_detail.template');
                        $('html,body').scrollTop(0);

                        // Table with prices and volume
                        self.trigger('renderTickerInfoTable', data);

                        // We got data from Yahoo, build datasets and render charts
                        data.labels = [];
                        data.open = [];
                        data.close = [];
                        data.adj_close = [];
                        data.high = [];
                        data.low = [];
                        data.volume = [];

                        data.quote = _.sortBy(data.quote, 'Date');
                        data.quote.forEach(function(dayInfo) {
                            data.labels.push(dayInfo.Date);
                            data.open.push(dayInfo.Open);
                            data.close.push(dayInfo.Close);
                            data.adj_close.push(dayInfo.Adj_Close);
                            data.high.push(dayInfo.High);
                            data.low.push(dayInfo.Low);
                            data.volume.push(dayInfo.Volume);
                        })

                        var chartData = {
                            labels: data.labels,
                            datasets: [{
                                label: "Open",
                                data: data.open
                            }, {
                                label: "Close",
                                data: data.close
                            }, {
                                label: "Adj Close",
                                data: data.adj_close
                            }, {
                                label: "High",
                                data: data.high
                            }, {
                                label: "Low",
                                data: data.low
                            }, {
                                label: "Volume",
                                data: data.volume
                            }]
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
                    tableHtml += '<td>' + dayInfo.Date + '</td>';
                    tableHtml += '<td>' + dayInfo.Open + '</td>';
                    tableHtml += '<td>' + dayInfo.Close + '</td>';
                    tableHtml += '<td>' + dayInfo.Adj_Close + '</td>';
                    tableHtml += '<td>' + dayInfo.High + '</td>';
                    tableHtml += '<td>' + dayInfo.Low + '</td>';
                    tableHtml += '<td>' + dayInfo.Volume + '</td>';
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

                // Copying to new object to get only the dataset we want (opening, closig, adj closing, etc.)
                var chartDataPriceOverview = $.extend({}, chartData);
                chartDataPriceOverview.datasets = chartDataPriceOverview.datasets.slice(0, 4);
                var lineChartCanvasPriceOverview = $("#priceOverviewChart").get(0).getContext("2d");
                var lineChartPriceOverview = Chart.Line(lineChartCanvasPriceOverview, {
                    data: chartDataPriceOverview,
                    options: chartOptions
                })

                var chartDataVolume = $.extend({}, chartData);
                chartDataVolume.datasets = [chartDataVolume.datasets[5]];
                var lineChartCanvasVolume = $("#tradingVolumesChart").get(0).getContext("2d");
                var lineChartVolume = Chart.Bar(lineChartCanvasVolume, {
                    data: chartDataVolume,
                    options: chartOptions
                })

                var chartDataOpening = $.extend({}, chartData);
                chartDataOpening.datasets = [chartDataOpening.datasets[0]];
                var lineChartCanvasOpening = $("#pricesOpeningChart").get(0).getContext("2d");
                var lineChartOpening = Chart.Line(lineChartCanvasOpening, {
                    data: chartDataOpening,
                    options: chartOptions
                })

                var chartDataClosing = $.extend({}, chartData);
                chartDataClosing.datasets = [chartDataClosing.datasets[1]];
                var lineChartCanvasClosing = $("#pricesClosingChart").get(0).getContext("2d");
                var lineChartClosing = Chart.Line(lineChartCanvasClosing, {
                    data: chartDataClosing,
                    options: chartOptions
                })

                var chartDataAdjClosing = $.extend({}, chartData);
                chartDataAdjClosing.datasets = [chartDataAdjClosing.datasets[2]];
                var lineChartCanvasAdjClosing = $("#pricesAdjClosingChart").get(0).getContext("2d");
                var lineChartAdjClosing = Chart.Line(lineChartCanvasAdjClosing, {
                    data: chartDataAdjClosing,
                    options: chartOptions
                })

                var chartDataHigh = $.extend({}, chartData);
                chartDataHigh.datasets = [chartDataHigh.datasets[3]];
                var lineChartCanvasHigh = $("#pricesHighChart").get(0).getContext("2d");
                var lineChartHigh = Chart.Line(lineChartCanvasHigh, {
                    data: chartDataHigh,
                    options: chartOptions
                })

                var chartDataLow = $.extend({}, chartData);
                chartDataLow.datasets = [chartDataLow.datasets[4]];
                var lineChartCanvasLow = $("#pricesLowChart").get(0).getContext("2d");
                var lineChartLow = Chart.Line(lineChartCanvasLow, {
                    data: chartDataLow,
                    options: chartOptions
                })
            }

            setTimeout(renderCharts, 2000, chartData);
        });

        this.get('#/industries', function(context) {
          self = this;
          // @todo: Refactor to function findIndustries()
          industries = [];
          self.stocks.forEach(function(stock) {
            industries = industries.concat(stock.industries);
          });
          industries.sort();
          // Source: http://mikeheavers.com/tutorials/removing_duplicates_in_an_array_using_javascript/
          industries = industries.filter(function(elem, pos) {
            return industries.indexOf(elem) == pos;
          });
          self.partial('templates/industries.template');
          self.trigger('renderIndustries', industries);
        });

        this.bind('renderIndustries', function(e, industries) {
            function renderIndustries(industries) {
              var industriesHtml = '';
              industries.forEach(function(industryName) {
                  industriesHtml += '<div class="col-md-4 col-sm-6 col-xs-12" id="industries">';
                  industriesHtml += '<div class="info-box">';
                  industriesHtml += '<div class="info-box-content no-margin">';
                  industriesHtml += '<span class="info-box-number medium"><a href="#/industry/'+ encodeURI(industryName) + '">'+ industryName +'</a></span>';
                  industriesHtml += '</div>';
                  industriesHtml += '</div>';
                  industriesHtml += '</div>';
                  industriesHtml += '<div class="clearfix visible-sm-block"></div>';
              });
              $('#industries').append(industriesHtml);
            }

            setTimeout(renderIndustries, 2000, industries);
        });

        this.get('#/key_people', function(context) {
          self = this;
          // @todo: Refactor to function findPeople()
          key_people = [];
          self.stocks.forEach(function(stock) {
            stock.key_people.forEach(function(person) {
              key_people.push({name: person, company: stock.local_ticker})
            })
          });
          key_people = _.sortBy(key_people, 'name');
          self.partial('templates/key_people.template');
          self.trigger('renderPeople', key_people);
        });

        this.bind('renderPeople', function(e, people) {
            function renderPeople(people) {
              var peopleHtml = '';
              people.forEach(function(person) {
                  peopleHtml += '<div class="col-md-4 col-sm-6 col-xs-12" id="industries">';
                  peopleHtml += '<div class="info-box">';
                  peopleHtml += '<div class="info-box-content no-margin">';
                  peopleHtml += '<span class="info-box-number medium">'+ person.name +'</span>';
                  peopleHtml += '<span class="info-box-more"><a href="#/stock/'+ person.company + '">' + person.company + '</a></span></br>';
                  peopleHtml += '</div>';
                  peopleHtml += '</div>';
                  peopleHtml += '</div>';
                  peopleHtml += '<div class="clearfix visible-sm-block"></div>';
              });
              $('#key-people').append(peopleHtml);
            }

            setTimeout(renderPeople, 2000, people);
        });

        this.get('#/industry/:industry_name', function(context) {
          self = this;
          // @todo: Refactor to function findPeople()
          industryStocks = [];
          industryNameSearch = decodeURI(self.params['industry_name']);
          self.stocks.forEach(function(stock) {
            stock.industries.forEach(function(industryName) {
              if(industryName == industryNameSearch) {
                industryStocks.push({name: stock.name, ticker: stock.local_ticker, img: stock.img})
              }
            })
          });

          industryStocks = _.sortBy(industryStocks, 'ticker');
          industryStocks = _.uniq(industryStocks, 'ticker');

          self.partial('templates/industry.template');
          self.trigger('renderIndustryStocks', industryStocks);
        });

        this.bind('renderIndustryStocks', function(e, stocks) {
            function renderIndustryStocks(stocks) {
              var industryStocksHtml = '';
              stocks.forEach(function(stock) {
                  industryStocksHtml += '<div class="col-md-4 col-sm-6 col-xs-12" id="industries">';
                  industryStocksHtml += '<div class="info-box">';
                  industryStocksHtml += '<a href="#/stock/' + stock.ticker + '"><span class="info-box-icon"><img src="' + stock.img + '"/></span></a>';
                  industryStocksHtml += '<div class="info-box-content">';
                  industryStocksHtml += '<span class="info-box-number"><a href="#/stock/' + stock.ticker + '">'+ stock.ticker + '</a></span>';
                  industryStocksHtml += '<span class="info-box-more">' + stock.name + '</span></br>';
                  industryStocksHtml += '</div>';
                  industryStocksHtml += '</div>';
                  industryStocksHtml += '</div>';
                  industryStocksHtml += '<div class="clearfix visible-sm-block"></div>';
              });
              $('#industry-stocks').append(industryStocksHtml);
            }

            setTimeout(renderIndustryStocks, 2000, stocks);
        });

        this.get('#/brands_products', function(context) {
          alert('Brands and products not available yet')
        });

        this.get('#/help', function(context) {
          alert('Help not available yet')
        });

    });

    $(function() {
        app.run('#/');
    });

})(jQuery);
