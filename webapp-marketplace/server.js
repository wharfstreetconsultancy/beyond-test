//
// Import required libraries
var express = require('express');
var http = require('http');
var https = require('https');
var request = require('request');
var fs = require('fs');
var replaceStream = require('replacestream')
var AWS = require('aws-sdk');
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
var key = fs.readFileSync('certs/domain.key');
var cert = fs.readFileSync('certs/domain.crt');
var options = {
	key: key,
	cert: cert
};
var productPort = process.env.PORT;
var productHost = 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com';
var productDomain = productHost+':'+productPort;

/* #################### REMOVE THIS ONCE TRUSTED CERT IS INSTALLED ON REST API ############### */
agent = new https.Agent({
	host: productHost,
	port: productPort,
	path: '/',
	rejectUnauthorized: false
});

//
// Create and run web server
http.createServer(app).listen(8080);
https.createServer(options, app).listen(8443);

//
//ALL '*' - Redirect all http traffic to https
app.all('*', function (req, res, next) {

	// Determine if request was https
	if(req.connection.encrypted) {

		next();
	} else {

		// Request was http - redirect caller to https
        console.log("Redirecting http request to: https://"+productDomain+req.url);
		res.redirect('https://'+productDomain+req.url);
		res.end();
		return;
	}
});

//
// GET '/' - Initial home page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );

	//
	// Load all existing products from REST API
	loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {

        // Format products into appropriate HTML
        formatProductsCarouselsHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {

            // Add dynamic elements to response page
            fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{error.message}', '&nbsp;'))
				.pipe(replaceStream('{showcase.clothing.carousel}', productsListClothingHtml))
				.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
				.pipe(res);
        });
	});
});

//
// GET '/product' - View product page
app.get('/product', function (req, res) {

	// Log request received
	console.log( "Received request: GET /product" );

	//
	// Load all specified product from REST API
	loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {

		if((productsList) && !Array.isArray(productsList)) {
			
			var productImageLocation = '';
			if(productsList.images) {
				for(var image of productsList.images) {
					if(image.isDefault) {
						productImageLocation = image.location;
					}
				}
			}

			// Add dynamic elements to response page
	        fs.createReadStream(__dirname+'/product.html')
				.pipe(replaceStream('{product.name}', product.name))
				.pipe(replaceStream('{product.description}', product.description))
				.pipe(replaceStream('{product.image.location}', productImageLocation))
				.pipe(replaceStream('{product.price}', product.price))
				.pipe(res);
		} else {
			
			// Something went wrong - determine cause
			var errorMessage = ((productsList.length == 0) ? 'No' : 'Multiple')+' products found for id "'+req.query.id+'"';
	        // Format products into appropriate HTML
	        formatProductsCarouselsHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {

	            // Add dynamic elements to response page
	            fs.createReadStream(__dirname+'/index.html')
					.pipe(replaceStream('{error.message}', errorMessage))
					.pipe(replaceStream('{showcase.clothing.carousel}', productsListClothingHtml))
					.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
					.pipe(res);
	        });
		}
	});
});

//
// Load existing product from datasource
function loadExistingProducts(req, res, callback) {

	var productId = (req.query.id) ? '/'+req.query.id : '';
	request.get({url:'https://'+productDomain+'/product'+productId, agent: agent}, function (productLoadError, productLoadResponse, productLoadBody) {
		
		if (productLoadError) {

			callback(productLoadError, null);
		} else {

			// Log error from remote server
			console.log( "REST API server responded with 'err': " + productLoadError );
			// Log status code from remote server
			console.log( "REST API server responded with 'status': " + productLoadResponse.statusCode );
			// Log response body from remote server
			console.log( "REST API server responded with 'body': " + productLoadBody );
	
			// Error handling
			if(productLoadResponse.statusCode != '200') {
	
				callback(productLoadBody, null);
			} else {
	
				callback(null, JSON.parse(productLoadBody));
			}
		}
	});
}

function formatProductsCarouselsHtml(productsList,callback) {

	// Initialise clothing HTML section
	var productsListClothingHtml = '';
	// Initialise jewellery HTML section
	var productsListJewelleryHtml = '';

	if(productsList) {

		// Iterate through product list
		for(var product of productsList) {

			if(product.promoted == 'true') {
	
				// Initialise current buffer
				var currentBuffer = '';

				// Write product in showcase carousel element
				currentBuffer += '<div class="col-md-3 col-sm-6 hero-feature">';
				currentBuffer += '<div class="thumbnail">';
				if(product.images) {
					for(var image of product.images) {
						if(image.isDefault) {
							console.log("Product ID: "+product.id);
							currentBuffer += '<a href="/product?id='+product.id+'"><img src="'+image.location+'" alt=""></a>';
						}
					}
				}
				currentBuffer += '<div class="caption">';
				currentBuffer += '<h3>'+product.name+'</h3>';
				currentBuffer += '<p/>';
				currentBuffer += '<p><a href="/product?id='+product.id+'" class="btn btn-primary">View Product</a></p>';
				currentBuffer += '</div>';
				currentBuffer += '</div>';
				currentBuffer += '</div>';
				
				if(product.type == 'CLOTHING') {
				
					// Write product into clothing list
					productsListClothingHtml += currentBuffer;
				} else if (product.type == 'JEWELLERY') {
				
					// Write product into jewellery list
					productsListJewelleryHtml += currentBuffer;
				}
	        }
		}
	}

	console.log("Clothing buffer: "+productsListClothingHtml);
	console.log("Jewellery buffer: "+productsListJewelleryHtml);

	// If there are no clothing products
	if(productsListClothingHtml.length == 0) {
	
		// Provide default message for clothing list
		productsListClothingHtml = 'No clothing currently showcased';
	}
	
	// If there are no jewellery products
	if(productsListJewelleryHtml.length == 0) {
	
		// Provide default message for jewellery list
		productsListJewelleryHtml = 'No jewellery currently showcased';
	}
	
	// Return to caller
	callback(productsListClothingHtml, productsListJewelleryHtml);
}