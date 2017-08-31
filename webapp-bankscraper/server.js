//
//
// Bank Scraper Web Site
//
//

//
// Manage environment
var express = require('express');
var request = require('request');
var htmlparser = require("htmlparser2");
var unique = require('array-unique');
var replaceall = require("replaceall");
var app = express();
var baseUrl = 'https://thebanks.eu';

//
// Create and run web server
var server = app.listen(8082, function() {

	// Output server endpoint
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
});

//
// GET '/' - Initial home page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );

	// Parse all countries
	parseCountries(baseUrl+'/banks-by-country', function (outputCountries) {

		var counterTotal = outputCountries.counterSuccess + outputCountries.counterConnectError + outputCountries.counterParseError;
		var percentSuccess = Math.round((outputCountries.counterSuccess / counterTotal) * 100);
		var percentConnectError = Math.round((outputCountries.counterConnectError / counterTotal) * 100);
		var percentParseError = Math.round((outputCountries.counterParseError / counterTotal) * 100);

                // Screen output
                console.log();
                console.log();
		console.log("================================");
                console.log("================================");
                console.log("Processed "+counterTotal+" banks accross "+outputCountries.countries.length+" countries");
		console.log(outputCountries.counterSuccess+" successes ("+percentSuccess+"); "+outputCountries.counterConnectError+" connection errors ("+percentConnectError+"); "+outputCountries.counterParseError+" parsing errors ("+percentParseError+")");
                console.log("================================");

                res.writeHead(200, {'Content-Type': 'text/html'})
		for(var outputCountry of outputCountries.countries) {

                        // Console output
                        console.log(outputCountry.banks.length+" banks in "+replaceall('"','', JSON.stringify(outputCountry.name))+" (percentages....)");

                        // Web page output
                        res.write('<h3>'+outputCountry.banks.length+' banks in '+JSON.stringify(outputCountry.name)+' (percentages....)</h3>');

			for(var outputBank of outputCountry.banks) {

				// Web page output
                        	res.write(outputBank.name+','+outputBank.url+','+outputBank.assets+'<br>');
			}

                        // Web page output
                        res.write('<hr>');
		}
                console.log("Ending output stream.");
                res.end();
        });
});

//
// Parse all countries
function parseCountries(url, callback) {

        // Download country list
	request.get({url:url}, function (countryListError, countryListResponse, countryListBody) {
		if (countryListError) throw countryListError;

                var counterSuccess = 0;
                var counterConnectError = 0;
                var counterParseError = 0;
		var countries = [];
		var outputCountries = [];

		// Parse country data
		var parser = new htmlparser.Parser({
			onopentag: function (name, attribs) {

				if(name === "a" && attribs.href.startsWith('/banks-by-country/')) {

					// Add country to country list
                                        countries.push(baseUrl+attribs.href);
				}
			},
			onend: function () {

				unique(countries);
                                process.stdout.write("Found "+countries.length+" countries\n");

	                	// Iterate through each country
        	        	for (var country of countries) {

                	        	// Parse banks within current country
                        		parseBanks(country, function (outputCountry) {

						counterSuccess += outputCountry.counterSuccess;
						counterConnectError += outputCountry.counterConnectError;
                                                counterParseError += outputCountry.counterParseError;

						outputCountries.push(outputCountry);

						process.stdout.write("\r\e[K");
						process.stdout.write("Processed "+outputCountries.length+" countries");

                                                if(countries.length == outputCountries.length) {

                                                        callback({
								countries: outputCountries,
								url: url,
                                                                counterSuccess: counterSuccess,
                                                                counterConnectError: counterConnectError,
                                                                counterParseError: counterParseError
							});
                                                }
                        		});
                		}
                	}
		}, {decodeEntities: true});
		parser.write(countryListBody);
		parser.end();
	});
}

//
// Parse banks within a given country
function parseBanks(url, callback) {

	// Download bank list for counntry
        request.get({url:url}, function (bankListError, bankListResponse, bankListBody) {
                if (bankListError) throw bankListError;

		var urlTokens = url.split('/');
		var countryName = urlTokens[urlTokens.length - 1];
                var counterSuccess = 0;
                var counterConnectError = 0;
                var counterParseError = 0;
                var banks = [];
		var outputBanks = [];

                // Parse bank data
                var parser = new htmlparser.Parser({

                        onopentag: function (name, attribs) {
                                if(name === "a" && attribs.href.startsWith(baseUrl+'/banks/')) {
                                        // Add bank to banks list
                                        banks.push(attribs.href);
                                }
                        },
			onend: function () {
				unique(banks);

                                // Iterate through each bank
                                for (var bank of banks) {

                                        // Parse details of current bank
                                        parseBank(bank, function (outputBank) {

						if(outputBank.name === 'Connect Error') {
							counterConnectError++;
						} else if(outputBank.name === 'Parse Error' || outputBank.asset === 'Parse Error') {
							counterParseError++;
						} else {
							counterSuccess++;
						}

						outputBanks.push(outputBank);

						if(banks.length == outputBanks.length) {

							// console.log("Processed all "+outputBanks.length+" banks from "+countryName);
							callback({
                                                                name: countryName,
                                                                banks: outputBanks,
								url: url,
                                                                counterSuccess: counterSuccess,
                                                                counterConnectError: counterConnectError,
                                                                counterParseError: counterParseError
                                                        });
						}
                                        });
                                }
			}
                }, {decodeEntities: true});
                parser.write(bankListBody);
                parser.end();
	});
}

//
//
function parseBank(url, callback) {

        // Download bank list for counntry
        request.get({url:url}, function (bankError, bankResponse, bankBody) {

                if (bankError) {
                        callback({
                        	name: 'Connect Error',
				url: url,
                                assets: 'Connect Error'
                        });
		}

	        var bankName = 'Parse Error';
                var bankAssets = 'Parse Error';

                // Parse bank data
                var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(bankParserError, dom) {
			if (bankParserError) {
	                        callback({
        	                        name: 'Parse Error',
                	                url: url,
                        	        assets: 'Parse Error'
	                        });
			}

			var titleTag = (htmlparser.DomUtils.getElementsByTagType('text', htmlparser.DomUtils.getElementsByTagName('title', dom)))[0];
			if(titleTag) {
				bankName = titleTag.data;
			}

			// Get financial details section
			var finDiv = htmlparser.DomUtils.getElementById('financials', dom);
			if(finDiv) {
				var finTab = htmlparser.DomUtils.getElements({tag_name: 'table', class: 'tab-data-row'}, finDiv);
				if(finTab) {
					var assetsCell = htmlparser.DomUtils.getElements({tag_name: 'td'}, finTab);
					if(assetsCell) {
						bankAssets = htmlparser.DomUtils.getElementsByTagType('text', assetsCell)[0].data;
					}
				}
			}

			callback({
				name: bankName,
				url: url,
				assets: bankAssets
			});
                }, {decodeEntities: true}));
                parser.write(bankBody);
                parser.end();
	});
}
