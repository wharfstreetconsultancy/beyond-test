//
//
// Bank Scraper Web Site
//
//

//
// Manage environment
var express = require('express');
var request = require('request');
var throttledRequest = require('throttled-request')(request);
var htmlparser = require("htmlparser2");
var unique = require('array-unique');
var replaceall = require("replaceall");
var strutil = require("underscore.string");
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

        console.log( "STATUS: Begin processing stage..." );

	// Configure request throttle
        console.log("Request throttle set to "+req.query.reqpersec+"/sec");
	var reqPerSec = ((req.query.reqpersec) ? req.query.reqpersec : 100);
	throttledRequest.configure({requests: reqPerSec, milliseconds: 1000});

	// Parse all countries
	parseCountries(baseUrl+'/banks-by-country', function (globalBankingData) {

	        console.log( "STATUS: ...end processing stage." );
	        console.log( "STATUS: Begin presentation stage..." );

		generateStats(globalBankingData.counterSuccess, globalBankingData.counterConnectError, globalBankingData.counterParseError, function (globalStats) {

	                // Console output
        	        console.log();
                	console.log();
			console.log("================================");
        	        console.log("================================");
                	console.log("Processed "+globalStats.counterTotal+" banks across "+globalBankingData.countries.length+" countries");
			console.log(globalStats.counterSuccess+" successes ("+globalStats.percentSuccess+"%); "+globalStats.counterConnectError+" connection errors ("+globalStats.percentConnectError+"%); "+globalStats.counterParseError+" parsing errors ("+globalStats.percentParseError+"%)");
        	        console.log("================================");

			// Web page output
                	res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write('<h1>Processed '+globalStats.counterTotal+' banks across '+globalBankingData.countries.length+' countries</h1>');
                        res.write('<h4>'+globalStats.counterSuccess+' successes ('+globalStats.percentSuccess+'%); '+globalStats.counterConnectError+' connection errors ('+globalStats.percentConnectError+'%); '+globalStats.counterParseError+' parsing errors ('+globalStats.percentParseError+'%)</h4>');
			res.write('<hr>');

			for(var country of globalBankingData.countries) {

		                generateStats(country.counterSuccess, country.counterConnectError, country.counterParseError, function (countryStats) {

	                        	// Console output
	                        	console.log("Processed "+countryStats.counterTotal+" banks in "+replaceall('"','', JSON.stringify(country.name)));
					console.log(countryStats.counterSuccess+" successes ("+countryStats.percentSuccess+"%); "+countryStats.counterConnectError+" connection errors ("+countryStats.percentConnectError+"%); "+countryStats.counterParseError+" parsing errors ("+countryStats.percentParseError+"%)");

	                        	// Web page output
                                        res.write('<h3>Processed '+countryStats.counterTotal+' banks in '+replaceall('"','', JSON.stringify(country.name))+'</h3>');
                                        res.write('<h4>'+countryStats.counterSuccess+' successes ('+countryStats.percentSuccess+'%); '+countryStats.counterConnectError+' connection errors ('+countryStats.percentConnectError+'%); '+countryStats.counterParseError+' parsing errors ('+countryStats.percentParseError+'%)</h4>');

					if(country.banks.length > 0) {

						// Console output
						console.log("| "+strutil("Name").rpad(45).value()+" | "+strutil("URL").rpad(35).value()+" | "+strutil("Assets").rpad(25).value()+" |");

						// Web page output
						res.write('<table width="80%">');
                                                res.write('<tr bgcolor="#dddddd"><th width="40%">Bank Name</th><th width="40%">Bank Assets</th></tr>');

						for(var bank of country.banks) {

							// Console output
							console.log("| "+strutil(bank.name).rpad(45).substring(0, 45).value()+" | "+strutil(bank.url).rpad(35).substring(0, 35).value()+" | "+strutil(bank.assets).rpad(25).substring(0, 25).value()+" |");

							// Web page output
	                        			res.write('<tr><td><a href="'+bank.url+'">'+bank.name+'</a></td><td>'+bank.assets+'</td></tr>');
						}
                                                // Console output
                                                console.log("");

                                                // Web page output
						res.write('</table>');
					}

	                        	// Web page output
	                        	res.write('<hr>');
				});
			}

	                console.log( "STATUS: ...end presentation stage." );
	                res.end();
		});
        });
});

//
// Parse all countries
function parseCountries(url, callback) {

        // Download country list
//	request.get({url:url}, function (countryListError, countryListResponse, countryListBody) {
	throttledRequest({url:url}, function (countryListError, countryListResponse, countryListBody) {
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
                                console.log("Found "+countries.length+" countries...");

	                	// Iterate through each country
        	        	for (var country of countries) {

                	        	// Parse banks within current country
                        		parseBanks(country, function (outputCountry) {

						counterSuccess += outputCountry.counterSuccess;
						counterConnectError += outputCountry.counterConnectError;
                                                counterParseError += outputCountry.counterParseError;

						outputCountries.push(outputCountry);

						console.log("----> "+outputCountries.length+":\t"+outputCountry.name+" ("+outputCountry.banks.length+" banks)");

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
//        request.get({url:url}, function (bankListError, bankListResponse, bankListBody) {
        throttledRequest({url:url}, function (bankListError, bankListResponse, bankListBody) {
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
						} else if(outputBank.name === 'Parse Error' || outputBank.assets === 'Parse Error') {
							counterParseError++;
						} else {
							counterSuccess++;
						}

						outputBanks.push(outputBank);

						process.stdout.write(".\r");

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
//        request.get({url:url}, function (bankError, bankResponse, bankBody) {
        throttledRequest({url:url}, function (bankError, bankResponse, bankBody) {

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

function generateStats(counterSuccess, counterConnectError, counterParseError, callback) {
	var counterTotal = counterSuccess + counterConnectError + counterParseError;
	callback({
		counterTotal: counterTotal,
		counterSuccess: counterSuccess,
		counterConnectError: counterConnectError,
		counterParseError: counterParseError,
		percentSuccess: Math.round((counterSuccess / counterTotal) * 100),
		percentConnectError: Math.round((counterConnectError / counterTotal) * 100),
		percentParseError: Math.round((counterParseError / counterTotal) * 100)
	});
}
