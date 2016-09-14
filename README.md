# Bertrade

[![Build Status](https://travis-ci.org/bertrade/bertrade-app.png?branch=master)](https://travis-ci.org/bertrade/bertrade-app)

Bertrade is a multiplatform open source app for exploring listed stock exchange companies, currently we only support Mexican Stock Exchange, however this is easily extensible to any worldwide stock exchange by simply generating a new JSON plain text file with the companies listed. Bertrade provides general information related to the companies so as historical prices and volumes with charts.

## Current Features

- Browse companies
- Search by local ticker
- Browse by Industry and Key People
- Cross-platform, mobile and responsive User Interface
- Works mostly on the client side without needing a server, this makes easier to package as standalone mobile app
- Can be easily extended to other stock markets by simply generating a JSON text file with companies that want to be included

## Installing

You can try out Bertrade in different ways:

- Download directly from [Google Play
 Store](https://play.google.com/store/apps/details?id=com.mandroslabs.bertrade) for Android devices.
- With any web browser try the sample app at [bertrade.mx](http://bertrade.mx).
- Get the .apk file from [Droidbin](http://www.droidbin.com/p1askg24om13mv1akchd11t95aon3) and install manually on your Android device.
- Download source from the [repository](https://github.com/bertrade/bertrade-app/archive/master.zip) and build yourself with PhoneGap using provided `config.xml` or simply upload to your Apache, NGINX or other static content server.

## Third party libraries

Without open source Bertrade wouldn’t be possible or would have taken significantly more efforts to do. It relies on the heavy lifting being done by other great open source projects:

- [Sammy.js](https://github.com/quirkey/sammy) for all routing and templating client side logic (alongside with Mustache).
- [Underscore](https://github.com/jashkenas/underscore) for general nice JS helpers like sorting an array by objects’ key.
- [Moment.js](https://github.com/moment/moment) for handling logics and calculations with dates.
- [AdminLTE bootstrap template](https://github.com/almasaeed2010/AdminLTE), we know how hard it is to get a nice looking responsive UI without being a designer or paying some money.
- [Charts.js](https://github.com/chartjs/Chart.js) for all client side charts.
- [PyWebRunner](https://github.com/IntuitiveWebSolutions/PyWebRunner) for tests using actual web browsers.
