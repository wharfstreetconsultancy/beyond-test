//
// Import required libraries
var express = require('express');
var session = require('express-session');
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
app.use(session({
	secret: 'keyboard cat named leon',
	resave: false,
	saveUninitialized: true,
	cookie: {secure: true}
}));
var key = fs.readFileSync('certs/domain.key');
var cert = fs.readFileSync('certs/domain.crt');
var options = {
	key: key,
	cert: cert
};
var securePort = process.env.SECURE_PORT;
var restPort = process.env.REST_PORT;
var restHost = 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com';
var restDomain = restHost+':'+restPort;
var cartCookieName = 'suroor-cart-id';

/* #################### REMOVE THIS ONCE TRUSTED CERT IS INSTALLED ON REST API ############### */
agent = new https.Agent({
	host: restHost,
	port: restPort,
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
        var secureUrl = 'https://'+req.host+':'+securePort+req.url
        console.log("Redirecting http request to: "+secureUrl);
		res.redirect(secureUrl);
		res.end();
		return;
	}
});

//
// GET '/' - Initial home page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );


	// Load cart from REST API
	loadExistingCart(req, res, function (cartLoadErrorMessage, cart) {

		if(cartLoadErrorMessage) {
			
			// Log error and continue
			console.log(cartLoadErrorMessage);
		}

		// Load all existing products from REST API
		loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {
	
	        // Format products into appropriate HTML
	        formatProductsCarouselsHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {
	
	            // Add dynamic elements to response page
	            fs.createReadStream(__dirname+'/index.html')
					.pipe(replaceStream('{error.message}', '&nbsp;'))
					.pipe(replaceStream('{showcase.clothing.carousel}', productsListClothingHtml))
					.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
					.pipe(replaceStream('{cart.items}', cart.items))
					.pipe(res);
	        });
		});
	});
});

//
// GET '/product' - View product page
app.get('/product', function (req, res) {

	// Log request received
	console.log( "Received request: GET /product" );

	// Load cart from REST API
	loadExistingCart(req, res, function (cartLoadErrorMessage, cart) {

		if(cartLoadErrorMessage) {
			
			// Log error and continue
			console.log(cartLoadErrorMessage);
		}
		
		// Load all specified product from REST API
		loadExistingProducts(req, res, function (productLoadErrorMessage, product) {
	
			// Check that only one product found
			if((product) && !Array.isArray(products)) {
	
				// Check if cart exists
				var cartId = 0;
				if(req.cookies) {
					if(req.cookies.cartCookieName) {
						
						cartId = req.cookies.cartCookieName;				
					}
				}
				console.log("Derived cart id: "+cartId);
	
		        // Format product into appropriate HTML
		        formatProductViewHtml(product, function(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml) {
	
		        // Load current shopping cart
		        
					// Add dynamic elements to response page
			        fs.createReadStream(__dirname+'/product.html')
						.pipe(replaceStream('{product.name}', product.name))
						.pipe(replaceStream('{product.description}', product.description))
						.pipe(replaceStream('{product.price}', product.price))
						.pipe(replaceStream('{product.image.carousel}', productImageCarouselHtml))
						.pipe(replaceStream('{product.color.selector}', productColorSelectorHtml))
						.pipe(replaceStream('{product.size.selector}', productSizeSelectorHtml))
//						.pipe(replaceStream('{form.action}', 'https://'+restDomain+'/cart/'+req.session.id+'/item'))
						.pipe(replaceStream('{cart.items}', cart.items))
						.pipe(res);
		        });
			} else {
				
				// Something went wrong - multiple products found - determine cause
				var errorMessage = ((productsList.length == 0) ? 'No' : 'Multiple')+' products found for id "'+req.query.id+'"';
		        // Format products into appropriate HTML
		        formatProductsCarouselsHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {
	
		            // Add dynamic elements to response page
		            fs.createReadStream(__dirname+'/index.html')
						.pipe(replaceStream('{error.message}', errorMessage))
						.pipe(replaceStream('{showcase.clothing.carousel}', productsListClothingHtml))
						.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
						.pipe(replaceStream('{cart.items}', cart.items))
						.pipe(res);
		        });
			}
		});
	});
});

//
// Load existing product from data source
function loadExistingProducts(req, res, callback) {

	var productId = (req.query.id) ? '/'+req.query.id : '';
	request.get({url:'https://'+restDomain+'/product'+productId, agent: agent}, function (productLoadError, productLoadResponse, productLoadBody) {
		
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


//
// Load existing cart from data source
function loadExistingCart(req, res, callback) {

	var cartId = 0;
	request.headers.cookie && request.headers.cookie.split(';').forEach(function( cookie ) {
		var parts = cookie.split('=');
		if(parts(0) == cartCookieName) {
			cartId = parts(1);
		}
	});

	request.get({url:'https://'+restDomain+'/cart'+cartId, agent: agent}, function (cartLoadError, cartLoadResponse, cartLoadBody) {
		
		if (cartLoadError) {

			callback(cartLoadError, null);
		} else {

			// Log error from remote server
			console.log( "REST API server responded with 'err': " + cartLoadError );
			// Log status code from remote server
			console.log( "REST API server responded with 'status': " + cartLoadResponse.statusCode );
			// Log response body from remote server
			console.log( "REST API server responded with 'body': " + cartLoadBody );
	
			// Error handling
			if(cartLoadResponse.statusCode != '200') {
	
				callback(cartLoadBody, null);
			} else {
	
				callback(null, JSON.parse(cartLoadBody));
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
				currentBuffer += '<div class=\'col-md-3 col-sm-6 hero-feature\'>';
				currentBuffer += '<div class=\'thumbnail\'>';
				if(product.images) {
					for(var image of product.images) {
						if(image.isDefault) {
							console.log("Product ID: "+product.id);
							currentBuffer += '<a href=\'/product?id='+product.id+'\'><img src=\''+image.location+'\' alt=\''+product.name+'\'></a>';
						}
					}
				}
				currentBuffer += '<div class=\'caption\'>';
				currentBuffer += '<h3>'+product.name+'</h3>';
				currentBuffer += '<p/>';
				currentBuffer += '<p><a href=\'/product?id='+product.id+'\' class=\'btn btn-primary\'>View Product</a></p>';
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

function formatProductViewHtml(product,callback) {

	// Initialise default image HTML buffer
	var productImageCarouselHtml = '&nbsp;';
	// Initialise product color selector HTML buffer
	var productColorSelectorHtml = '&nbsp;';
	// Initialise product size selector HTML buffer
	var productSizeSelectorHtml = '&nbsp;';

	// If the product exists
	if(product) {

		// If the product has colors
		if(product.colors) {

			productColorSelectorHtml = 'Color Choices:<br>';
			productColorSelectorHtml += '<select name=\'selected_color\'>';

			// For each color that the product has
			for(var color of product.colors) {

					// Add current color as an option to the selector
					productColorSelectorHtml += '<option value=\''+color+'\'>'+color+'</option>';
			}
			productColorSelectorHtml += '</select>';

		}

		// If the product has sizes
		if(product.sizes) {

			productSizeSelectorHtml = 'Size Choices:<br>';
			productSizeSelectorHtml += '<select name=\'selected_size\'>';

			// For each size that the product has
			for(var size of product.sizes) {

					// Add current size as an option to the selector
					productSizeSelectorHtml += '<option value=\''+size+'\'>'+size+'</option>';
			}
			productSizeSelectorHtml += '</select>';

		}
		// If the product has images
		if(product.images.length > 0) {

			// Initialise indicator item HTML buffer
			var itemIndicatorHtml = '';
			// Initialise image item HTML buffer
			var itemImageHtml = '';
			// Initialise image counter
			var imageCounter = 0;
			// Reset carousel HTML buffer as we have images
			productImageCarouselHtml = '';

			// For each image that the product has
			for(var image of product.images) {

				// Construct item indicator for current image
				itemIndicatorHtml += '<li data-target=\'#productCarousel\' data-slide-to=\''+(imageCounter++)+'\''+((image.isDefault) ? ' class=\'active\'' : '')+'></li>';

				// Construct image item reference for current image
				itemImageHtml += '<div class=\'item'+((image.isDefault) ? ' active' : '')+'\'>';
				itemImageHtml += '<img src=\''+image.location+'\' width=\'210\' alt=\''+product.name+'\'>';
				itemImageHtml += '</div>';

			}
			
			// Load carousel template and replace item indicators and references
			var carouselStream = fs.createReadStream(__dirname+'/carousel.html', 'utf8')
				.pipe(replaceStream('{item.indicators}', itemIndicatorHtml))
				.pipe(replaceStream('{item.images}', itemImageHtml));
			carouselStream.on('data', function (data) {productImageCarouselHtml += data;});
			carouselStream.on('end', function () {
				console.log("Constructed carousel HTML: "+productImageCarouselHtml);
				
				// Return to caller
				callback(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml);
			});
		} else {

			// Return to caller
			callback(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml);
		}

	} else {

		// Return to caller
		callback(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml);
	}
}









//
// GET - cart API - Get entire cart for current user
app.get('/cart/:id', function (req, res) {

        // Log request received
        console.log( "Received request: GET /cart/"+req.params.id );

        loadCart(req.params.id, function (cartError, existingCart) {

        	// Handle error
        	if(cartError) {
        		
        		// Return cart items to caller
				res.writeHead(404, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(cartError));
				res.end();
        	} else {

        		// Return cart items to caller
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(existingCart));
				res.end();
        	}
        });
});

//
// GET - cart API - Get entire cart for current user
app.get('/cart/:id/item', function (req, res) {

        // Log request received
        console.log( "Received request: GET /cart/"+req.params.id );

        var cartItems = [];
        if(req.params.id == 0) {
        	console.log("Cart is empty.");
        }
        
		// Return cart items to caller
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(cartItems));
		res.end();
});

//
// POST - cart API - Create new cart item
app.post('/cart/:id/item', function (req, res) {

        // Log request received
        console.log( "Received request: POST /cart/"+req.params.id+"/item" );

        // Create new cart item
        console.log("Request params in body: "+JSON.stringify(req.body));
        console.log("Cookies: "+JSON.stringify(req.cookies));

        var timestamp = new Date().getTime().toString();
        var newCartItem = {
			id: '09876543',
			productId: '111',
			quantity: 2,
			color: '333',
			size: '444',
			cost: '5.55',
			lastUpdated: timestamp
        }
        console.log("Requested new cart item: "+JSON.stringify(newCartItem));
        
		if (req.params.id != 0 && req.params.id != 'undefined') {
			
			// Cart exists 
			console.log("Cart exists - load cart");
		} else {

			// Cart does not exist
			console.log("Cart does not exist - create and store cart");

			// Create new cart
			var newCart = {
				id: timestamp.split("").reverse().join(""),
				items: [newCartItem]
			}
			console.log("Cart created: "+JSON.stringify(newCart))

			// Create params for cart 'store' operation
			var storeCartParams = {
				TableName: 'SuroorFashionsCarts',
				Item: newCart
			};

			// Log contents of dynamo db store operation
			console.log("Uploading cart with: "+ JSON.stringify(storeCartParams));

			// Perform product store operation
			dddc.put(storeCartParams, function (err, data) {
				if (err) {

					console.log('Failed to store cart id "'+newCart.id+'". '+err);
					
					// Return error to caller
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.write('Failed to store cart id "'+newCart.id+'". '+err);
					res.end();
				} else {

					// Log output from data store
					console.log("Data returned from data store: "+JSON.stringify(data));

					// Set cart id into a cookie with the response
					res.cookie(cartCookieName, newCart.id, {maxAge: (30*24*60*60*1000), httpOnly: false});
					// Return new cart item to caller
					res.writeHead(201, {'Content-Type': 'application/json', Location: 'https://'+restDomain+'/cart/'+newCart.id+'/item/'+newCartItem.id});
					res.write(JSON.stringify(newCartItem));
					res.end();
				}
			});
		}
});

//
// Get specified cart from the product catalog
function loadCart(cartId, callback) {

	var params;
	// Create load params
	if(!cartId || cartId == 0) {

		callback('No cart specified', null);
		return;
	} else {

		// Cart id specified, create params
		params = {
			TableName: 'SuroorFashionsCarts',
			// Limit: 10,
            ExpressionAttributeValues: {':c': cartId},
			FilterExpression: 'id = :c'
		};
	}
	console.log("Searching for existing cart with: "+JSON.stringify(params));
	// Perform product load action
	dddc.scan(params, function (err, cartData) {

		if(err) {

			// Return error to caller
			callback('Failed to load cart', null);
		} else {


			// Log loaded  cart
			console.log("Loaded cart data: "+JSON.stringify(carData));

			// Check only one cart loaded.
			if(cartData.Items.length > 1) {
				callback('More than one cart found for: '+cartId);
				return;
			}
			
			// Return  cart to caller
			callback(null, cartData.Items(0));
			return;
		}
	});
}
