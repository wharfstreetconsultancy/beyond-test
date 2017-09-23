//
// Import required libraries
var express = require('express');
var session = require('express-session');
var http = require('http');
var https = require('https');
var request = require('request');
var fs = require('fs');
var replaceStream = require('replacestream')
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
var CognitoSDK = require('amazon-cognito-identity-js-node');
AWS.CognitoIdentityServiceProvider.CognitoUserPool = CognitoSDK.CognitoUserPool;
AWS.CognitoIdentityServiceProvider.AuthenticationDetails = CognitoSDK.AuthenticationDetails;
AWS.CognitoIdentityServiceProvider.CognitoUserAttribute = CognitoSDK.CognitoUserAttribute;
AWS.CognitoIdentityServiceProvider.CognitoUser = CognitoSDK.CognitoUser;
var userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : 'us-west-2_jnmkbOGZY',
    ClientId : 'm1f0r4q7uqgr9vd0qbqouspha'
});

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.json({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));
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
					.pipe(replaceStream('{cart.items}', (cart && cart.items) ? JSON.stringify(cart.items) : '[]'))
					.pipe(res);
	        });
		});
	});
});

//
// POST '/signup' - Sign-up new user
app.post('/signup', function (req, res) {
	console.log("Username: "+req.body.username);
	console.log("Password: "+req.body.password);
	console.log("Phone number: "+req.body.phone_number);
	    
    var attributeList = [];
    attributeList.push({Name: 'phone_number', Value: req.body.phone_number});
    attributeList.push({Name: 'address', Value: 'dummy address'});
    attributeList.push({Name: 'given_name', Value: 'dummy given name'});
    attributeList.push({Name: 'family_name', Value: 'dummy family name'});
    
    console.log("Attribute list: "+JSON.stringify(attributeList));
    
	userPool.signUp(
		req.body.username,
		req.body.password,
		attributeList,
		null,
		function (err, data) {

			if (err) {
				console.log("!ERROR! - Failed to sign-up user: "+err);
			} else {
				console.log(data);
	
	            // Return response to caller
	            res.writeHead(200, {'Content-Type': 'application/json'});
	            res.end();
			}
	});
});

//
// POST '/signin' - Sign-in existing user
app.post('/signin', function (req, res) {
	console.log("Username: "+req.body.username);
	console.log("Password: "+req.body.password);

	var authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails({
		Username: req.body.username,
		Password: req.body.password
	});
	var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser({Username: req.body.username, Pool: userPool});
//	console.log("User before auth: "+JSON.stringify(cognitoUser));
	cognitoUser.authenticateUser(authenticationDetails, {
		onFailure: function (err) {
			
			console.log("!ERROR! - "+err);
		},
		onSuccess: function (result) {
			
			console.log("Result after auth: "+JSON.stringify(result));
			console.log('Login success for '+cognitoUser.username);
			cognitoUser.getUserAttributes(function(err, result) {
		        if (err) {

		        	console.log("!ERROR! - "+err);
		        } else {

		        	var userProfileBuffer = '{';
			        for(var attribute of result) {
			            
			        	userProfileBuffer += '"'+attribute.getName().Name+'":"'+attribute.getName().Value+'",';
			        }
			        userProfileBuffer = userProfileBuffer.substring(0, userProfileBuffer.length-1);
			        userProfileBuffer += '}';
		        	console.log("User Profile: "+userProfileBuffer);
			        
					// Return response to caller
		            res.writeHead(200, {'Content-Type': 'application/json'});
		            res.write(userProfileBuffer);
		            res.end();
		        }
		    });
		}
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
			if((product) && !Array.isArray(product)) {
	
				// Get cart id
//				var cartId = 0;
//				req.headers.cookie && req.headers.cookie.split(';').forEach(function (cookie) {
//					var parts = cookie.split('=');
//					if(parts[0] == 'connect.sid') {
//						cartId = parts[1];
//					}
//				});
//				console.log("Derived cart id: "+cartId);
	
		        // Format product into appropriate HTML
		        formatProductViewHtml(product, function(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml) {
	
		        // Load current shopping cart
		        
					// Add dynamic elements to response page
			        fs.createReadStream(__dirname+'/product.html')
						.pipe(replaceStream('{product.id}', product.id))
						.pipe(replaceStream('{product.name}', product.name))
						.pipe(replaceStream('{product.description}', product.description))
						.pipe(replaceStream('{product.price}', product.price))
						.pipe(replaceStream('{product.image.carousel}', productImageCarouselHtml))
						.pipe(replaceStream('{product.color.selector}', productColorSelectorHtml))
						.pipe(replaceStream('{product.size.selector}', productSizeSelectorHtml))
						.pipe(replaceStream('{rest.domain}', JSON.stringify(restDomain)))
						.pipe(replaceStream('{cart.items}', (cart && cart.items) ? JSON.stringify(cart.items) : '[]'))
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
						.pipe(replaceStream('{cart.items}', (cart && cart.items) ? JSON.stringify(cart.items) : '[]'))
						.pipe(res);
		        });
			}
		});
	});
});

//
// GET '/cart' - View cart page
app.get('/cart', function (req, res) {

	// Log request received
	console.log( "Received request: GET /cart" );

	var userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool({
	    UserPoolId : 'us-west-2_jnmkbOGZY',
	    ClientId : 'm1f0r4q7uqgr9vd0qbqouspha'
	});
	
	// Load cart from REST API
	loadExistingCart(req, res, function (cartLoadErrorMessage, cart) {

		if(cartLoadErrorMessage) {
			
			// Log error and continue
			console.log(cartLoadErrorMessage);
		} else {
			
		}
		
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

	// Get cart id
	var cartId = 0;
	req.headers.cookie && req.headers.cookie.split(';').forEach(function (cookie) {
		var parts = cookie.split('=');
		if(parts[0] == 'connect.sid') {
			cartId = parts[1];
		}
	});
	console.log("Derived cart id: "+cartId);

	request.get({url:'https://'+restDomain+'/cart/'+cartId, agent: agent}, function (cartLoadError, cartLoadResponse, cartLoadBody) {
		
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
			productColorSelectorHtml += '<select name=\'newCartItem[color]\'>';

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
			productSizeSelectorHtml += '<select name=\'newCartItem[size]\'>';

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
