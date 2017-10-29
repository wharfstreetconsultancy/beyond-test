//
// Import required libraries
var express = require('express');
var session = require('express-session');
var DynamoDBStore = require('connect-dynamodb')({session: session});
var http = require('http');
var https = require('https');
var events = require('events');
var request = require('request');
var fs = require('fs');
var replaceStream = require('replacestream')
var replaceall = require("replaceall");
var bodyParser = require('body-parser');

var srvEnvKey = process.env.SRV_ENV;
console.log("SERVER ENV: "+srvEnvKey);
//var configBucket = 'SuroorFashionsServerConfig';
//var srvEnvProps = {
//	    Bucket: configBucket,
//	    Key: 'marketplace_server.'+srvEnvKey+'.env.properties'
//};
//console.log("Server env props: "+JSON.stringify(srvEnvProps));

var pgwEnvKey = process.env.PGW_ENV;
console.log("PAYMENT-GATEWAY ENV: "+pgwEnvKey);
//var pgwEnvProps = {
//	    Bucket: configBucket,
//	    Key: 'payment_gateway.'+pgwEnvKey+'.env.properties'
//};
//console.log("Payment-gateway env props: "+JSON.stringify(pgwEnvProps));

console.log("SESSION_SECRET="+process.env.SESSION_SECRET);
console.log("AWS_PROFILE="+process.env.AWS_PROFILE);
console.log("AWS_ACCESS_KEY_ID="+process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY="+process.env.AWS_SECRET_ACCESS_KEY);
console.log("AWS_REGION="+process.env.AWS_REGION);
console.log("AUTH_CLIENT="+process.env.AUTH_CLIENT);
console.log("SECURE_PORT="+process.env.SECURE_PORT);
console.log("REST_HOST="+process.env.REST_HOST);
console.log("REST_PORT="+process.env.REST_PORT);
console.log("PGW_CLIENT="+process.env.PGW_CLIENT);
console.log("PGW_SECRET="+process.env.PGW_SECRET);
console.log("PGW_HOST="+process.env.PGW_HOST);

//
// Configure AWS env
var AWS = require('aws-sdk');
//var credentials = new AWS.SharedIniFileCredentials({profile: process.env.AWS_PROFILE});
//AWS.config.credentials = credentials;
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
var CognitoSDK = require('amazon-cognito-identity-js-node');

AWS.config.update({region: process.env.AWS_REGION});
AWS.CognitoIdentityServiceProvider.CognitoUserPool = CognitoSDK.CognitoUserPool;
AWS.CognitoIdentityServiceProvider.AuthenticationDetails = CognitoSDK.AuthenticationDetails;
AWS.CognitoIdentityServiceProvider.CognitoUserAttribute = CognitoSDK.CognitoUserAttribute;
AWS.CognitoIdentityServiceProvider.CognitoUser = CognitoSDK.CognitoUser;
var userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool({
	UserPoolId: 'us-west-2_jnmkbOGZY',
	ClientId: process.env.AUTH_CLIENT
});


//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.json({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: process.env.SESSION_SECRET,
	store: new DynamoDBStore({AWSConfigJSON: {region: process.env.AWS_REGION}, table: 'SuroorFashionsSessionsUsers_'+srvEnvKey.toUpperCase()}),
	resave: false,
	saveUninitialized: true,
	cookie: {secure: true}
}));


var securePort = process.env.SECURE_PORT;
var restHost = process.env.REST_HOST;
var restPort = process.env.REST_PORT;
var restDomain = restHost+':'+restPort;
var paymentDomain = process.env.PGW_HOST;

/* #################### REMOVE THIS ONCE TRUSTED CERT IS INSTALLED ON REST API ############### */
var agent = new https.Agent({
	host: restHost,
	port: restPort,
	path: '/',
	rejectUnauthorized: false
});

//var suroorServer = new events.EventEmitter();
//suroorServer.on('start_server', function () {
//
//	console.log("Starting server.");
//	var options = {
//
//		key: key,
//		cert: cert
//	};
//	
//	//
//	// Create and run web server
//	http.createServer(app).listen(8080);
//	https.createServer(options, app).listen(8443);
//});

var key = fs.readFileSync('certs/suroorfashions.com.key');
var cert = fs.readFileSync('certs/suroorfashions.com.crt');
console.log("Starting server.");
http.createServer(app).listen(8080);
var options = {key: key, cert: cert};
https.createServer(options, app).listen(8443);

//var configBucket = 'suroor.fashions.config';
//var key = null;
//var cert = null;
//s3.getObject({Bucket: configBucket, Key: 'suroorfashions.com.key'}, function (error, data) {
//	if(error) {
//		console.log("Key not loaded! "+error);
//	} else {
//		console.log("Key loaded.");
//		key = data;
//		if(cert != null) {console.log("Cert loaded.");suroorServer.emit('start_server');} else {console.log("Cert not loaded!");}
//	}
//});
//s3.getObject({Bucket: configBucket, Key: 'suroorfashions.com.crt'}, function (error, data) {
//	if(error) {
//		console.log("Cert not loaded! "+error);
//	} else {
//		console.log("Cert loaded.");
//		cert = data;
//		if(key != null) {console.log("Key loaded.");suroorServer.emit('start_server');} else {console.log("Key not loaded!");}
//	}
//});











//var configBucket = 'suroor.fashions.config';
//s3.getObject({Bucket: configBucket, Key: 'suroorfashions.com.key'}, function (error, key) {
//
//	if(error) {
//
//		console.log("Key not loaded! "+error);
//	} else {
//
//		console.log("Key loaded.");
//
//		s3.getObject({Bucket: configBucket, Key: 'suroorfashions.com.crt'}, function (error, cert) {
//
//			if(error) {
//
//				console.log("Cert not loaded! "+error);
//			} else {
//
//				console.log("Cert loaded.");
//				console.log("Starting server.");
//
//				http.createServer(app).listen(8080);
//				https.createServer({key: key, cert: cert}, app).listen(8443);
//			}
//		});
//	}
//});



//
// ALL '*' - Redirect all http traffic to https
app.all('*', function (req, res, next) {

	// Determine if request was https
	if(req.connection.encrypted) {

		next();
		console.log("Not found yet? "+req.url);
	} else {

		// Request was http - redirect caller to https
        var secureUrl = 'https://'+req.hostname+':'+securePort+req.url
        console.log("Redirecting http request to: "+secureUrl);
		res.redirect(secureUrl);
		res.end();
	}
	return;
});

//
// GET '/' - Initial home page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );

	// Load all existing products from REST API
	loadExistingProducts(null, function (productLoadErrorMessage, productsList) {

        // Format products into appropriate HTML
        formatProductsCarouselsHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {

            // Add dynamic elements to response page
            fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{error.message}', '&nbsp;'))
				.pipe(replaceStream('{products.list}', JSON.stringify(productsList)))
//				.pipe(replaceStream('{showcase.clothing.carousel}', productsListClothingHtml))
//				.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
				.pipe(res);
        });
	});
});

//
// GET '/product' - View product page
app.get('/product', function (req, res) {

	// Log request received
	console.log( "Received request: GET /product" );

	// Load all specified product from REST API
	loadExistingProducts(req.query.id, function (productLoadErrorMessage, product) {

		// Check that only one product found
		if((product) && !Array.isArray(product)) {

	        // Format product into appropriate HTML
	        formatProductViewHtml(product, function(productImageCarouselHtml, productColorSelectorHtml, productSizeSelectorHtml) {

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
					.pipe(res);
	        });
		} else {
			
			// Something went wrong - multiple products found - determine cause
			var errorMessage = ((!product || product.length == 0) ? 'No' : 'Multiple')+' products found for id "'+req.query.id+'"';
	        // Format products into appropriate HTML
	        formatProductsCarouselsHtml(product, function(productsListClothingHtml, productsListJewelleryHtml) {

	            // Add dynamic elements to response page
	            fs.createReadStream(__dirname+'/index.html')
					.pipe(replaceStream('{error.message}', errorMessage))
					.pipe(replaceStream('{products.list}', productsList))
					.pipe(replaceStream('{showcase.jewellery.carousel}', productsListJewelleryHtml))
					.pipe(res);
	        });
		}
	});
});

//
// GET '/about' - View 'about' page
app.get('/about', function (req, res) {

	// Log request received
	console.log( "Received request: GET /about" );

	// Return 'about' page
    fs.createReadStream(__dirname+'/about.html')
    	.pipe(res);
});

//
// GET '/contact' - View 'contact' page
app.get('/contact', function (req, res) {

	// Log request received
	console.log( "Received request: GET /contact" );

	// Return 'contact' page
    fs.createReadStream(__dirname+'/contact.html')
    	.pipe(res);
});

//
// GET '/shop' - View 'shop' page
app.get('/shop', function (req, res) {

	// Log request received
	console.log( "Received request: GET /shop" );

	// Load all existing products from REST API
	loadExistingProducts(null, function (productLoadErrorMessage, productsList) {

        // Add dynamic elements to response page
        fs.createReadStream(__dirname+'/shop.html')
			.pipe(replaceStream('{products.list}', JSON.stringify(productsList)))
			.pipe(res);
        return;
	});
});

//
// GET '/signin' - View 'signin' page
app.get('/signin', function (req, res) {

	// Log request received
	console.log( "Received request: GET /signin" );

	// Return 'signin' page
    fs.createReadStream(__dirname+'/signin.html')
		.pipe(replaceStream('{check.cart}', false))
    	.pipe(res);
    return;
});

//
// GET '/signup' - View 'signup' page
app.get('/signup', function (req, res) {

	// Log request received
	console.log( "Received request: GET /signup" );

	// Return 'signup' page
    fs.createReadStream(__dirname+'/signup.html')
		.pipe(replaceStream('{check.cart}', false))
    	.pipe(res);
    return;
});

//
// POST '/cart' - View 'cart' page
app.post('/cart', function (req, res) {

	// Log request received
	console.log( "Received request: POST /cart" );

	var customer = req.session.customer; 
	if(!customer || !customer.signInUserSession) {
		
		console.log("No customer found - redirect to sign-in.");

		// Return 'signin' page
	    fs.createReadStream(__dirname+'/signin.html')
			.pipe(replaceStream('{check.cart}', true))
	    	.pipe(res);
	    return;
	} else {

		console.log("Customer found and signed-in:"+JSON.stringify(customer));

		var localCartParam = req.body.cart;
		console.log("Local cart: "+localCartParam);
		if(localCartParam) {

			var localCart = JSON.parse(localCartParam);
			if(localCart && localCart.items) {
	
				var sanitisedCart = {id: localCart.id, items: []};
				for(var item of localCart.items) {
	
					// Load all specified product from REST API
					loadExistingProducts(item.productId, function (productLoadError, product) {
						if(productLoadError) {
	
							console.log("!ERROR! - Failed to sanitise cart: "+productLoadError);
						} else {
	
						    var newCartItem = {
								id: item.id,
								productId: item.productId,
								productName: product.name,
								quantity: item.quantity,
								color: item.color,
								size: item.size,
								cost: product.cost,
								created: item.created,
								lastUpdated: item.lastUpdated
						    }
						    sanitisedCart.push(newItem);
						}
					});
				}  
			}
		}

		console.log("Customer signed-in.");

//		profileCustomer(customer, function(customerProfileError, customerProfile) {

//	        if(customerProfileError) {
//				
//				console.log("!ERROR! - Failed to profile customer: "+customerProfileError);
//
//				// Return error to caller
//	            res.writeHead(500, {'Content-Type': 'application/json'});
//	            res.write(JSON.stringify({error: customerProfileError}));
//	            res.end();
//	        } else {
	        	
//				console.log("Customer profiled successfully.");

				// Load all specified product from REST API
				loadExistingCart(customer.username, function (cartLoadError, storedCart) {
		
					if(cartLoadError) {
		
						console.log("No cart found for customer (id: "+customer.username+". Error: "+cartLoadError);
					}
					if(storedCart && storedCart.items && storedCart.items.length > 0) {
						
						console.log("Cart found for user (id: "+customer.username+") - "+storedCart);
						for(var oldItem of storedCart.items) {
		
						    var existingCartItem = sanitisedCart.items.filter(function (sanitisedItem) {
		
						    	var sameItem = (
						    		(sanitisedItem.productId === oldItem.productId) &&
						    		(sanitisedItem.color === oldItem.color) &&
						    		(sanitisedItem.size === oldItem.size)
						    	);
						    	return sameItem;
						    });
						    if(existingCartItem.length == 0) {
		
						    	console.log("Old cart item found, that does not exist in latest cart: "+JSON.stringify(oldItem));
						    	sanitisedCartItem.push(oldItem);
						    }
						}
					} else {
		
						console.log("No cart found for customer (id: "+customer.username+")");
					}
				});
//	        }
//	    });

		// Return 'cart' page
	    fs.createReadStream(__dirname+'/cart.html')
			.pipe(replaceStream('{environment}', pgwEnvKey))
			.pipe(replaceStream('{latest.cart}', (sanitisedCart) ? sanitisedCart : 'null'))
	    	.pipe(res);
	    return;
	}
});

//
// Load existing product from data source
function loadExistingProducts(productId, callback) {

	request.get({url:'https://'+restDomain+'/product'+((productId != null) ? '/'+productId : ''), agent: agent}, function (productLoadError, productLoadResponse, productLoadBody) {
		
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
function loadExistingCart(cartId, callback) {

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
							currentBuffer += '<a href=\'/product?id='+product.id+'\'><img src=\''+image.location+'\' width=\'150\' alt=\''+product.name+'\'></a>';
						}
					}
				}
				currentBuffer += '<div class=\'caption\'>';
				currentBuffer += '<h3>'+product.name+'</h3>';
				currentBuffer += '<p/>';
				currentBuffer += '<p><a href=\'/product?id='+product.id+'\' class=\'btn btn-primary\'>View</a></p>';
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
			productColorSelectorHtml += '<select id=\'productColor\' name=\'newCartItem[productColor]\'>';

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
			productSizeSelectorHtml += '<select id=\'productSize\' name=\'newCartItem[productSize]\'>';

			// For each size that the product has
			for(var size of product.sizes) {

					// Add current size as an option to the selector
					productSizeSelectorHtml += '<option value=\''+size+'\'>'+size+'</option>';
			}
			productSizeSelectorHtml += '</select>';

		}
		// If the product has images
		if(product.images && product.images.length > 0) {

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
				itemImageHtml += '<img src=\''+image.location+'\' width=\'150\' alt=\''+product.name+'\'>';
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
// GET '/customer' - Get customer id
app.get('/customer', function (req, res) {

	// Log request received
	console.log( "Received request: GET /customer" );

	var customer = req.session.customer; 
	if(customer) {
		
		console.log("Found customer: "+customer.sub);
		
        if(!(customer.signInUserSession)) {
			
    		console.log("Customer not signed-in.");

    		// Return error to caller
    	    res.writeHead(404, {'Content-Type': 'application/json'});
    	    res.write(JSON.stringify({customer: null}));
    	    res.end();
        } else {
        	
			console.log("Customer signed-in.");

			profileCustomer(customer, function(customerProfileError, customerProfile) {

		        if(customerProfileError) {
					
					console.log("!ERROR! - Failed to profile customer: "+customerProfileError);
	
					// Return error to caller
		            res.writeHead(500, {'Content-Type': 'application/json'});
		            res.write(JSON.stringify({error: customerProfileError}));
		            res.end();
		        } else {
		        	
					console.log("Customer profiled successfully.");

					// Return customer to caller
				    res.writeHead(200, {'Content-Type': 'application/json'});
				    res.write(JSON.stringify({customer: customerProfile}));
				    res.end();
		        }
			});
        }
	} else {
		console.log("No customer found.");

		// Return error to caller
	    res.writeHead(404, {'Content-Type': 'application/json'});
	    res.write(JSON.stringify({customer: null}));
	    res.end();
	}
});

//
// POST '/customer' - Sign-up new user
app.post('/customer', function (req, res) {

    // Log request received
    console.log( "Received request: POST /customer" );

	console.log("Email: "+req.body.email);
	console.log("Name: "+req.body.given_name+" "+req.body.family_name);
	console.log("Tel: "+JSON.stringify(req.body.tel));
	var phoneNumber = "+1"+req.body.tel.part1+req.body.tel.part2+req.body.tel.part3;
	console.log("Parsed tel: "+phoneNumber);
	console.log("Address: "+JSON.stringify(req.body.address));
	console.log("Parsed address: "+req.body.address.line1+", "+req.body.address.line2+", "+req.body.address.city+", "+req.body.address.state+" "+req.body.address.zip);

	var attributeList = [];
	attributeList.push({Name: 'phone_number', Value: phoneNumber});
	attributeList.push({Name: 'address', Value: JSON.stringify(req.body.address)});
	attributeList.push({Name: 'given_name', Value: req.body.given_name});
	attributeList.push({Name: 'family_name', Value: req.body.family_name});

	userPool.signUp(
		req.body.email,
		req.body.password,
		attributeList,
		null,
		function (error, data) {

			if(error) {
				
				console.log("!ERROR! - Failed to sign-up user: "+error);

				// Return error to caller
	            res.writeHead(400, {'Content-Type': 'application/json'});
	            res.write(JSON.stringify({error: error}));
	            res.end();
			} else {
				
				console.log("Sign-up success: "+data.user.username);

	            // Return response to caller
	            res.writeHead(201, {'Content-Type': 'application/json'});
	            res.write(JSON.stringify({username: data.user.username}));
	            res.end();
			}
	});
});

//
// POST '/customer/session' - Sign-in existing user
app.post('/customer/session', function (req, res) {

    // Log request received
    console.log( "Received request: POST /customer/session" );

	var authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails({
		Username: req.body.email,
		Password: req.body.password
	});
	var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser({Username: req.body.email, Pool: userPool});
	cognitoUser.authenticateUser(authenticationDetails, {
		onFailure: function (error) {
			
			console.log("!ERROR! - Failed to sign-in customer: "+error);

			// Return error to caller
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({error: error}));
            res.end();
		},
		onSuccess: function (result) {

			console.log('Sign-in success - username: '+cognitoUser.username);

			profileCustomer(cognitoUser, function(customerProfileError, customerProfile) {
		        if(customerProfileError) {
					
					console.log("!ERROR! - Failed to profile customer: "+customerProfileError);

					// Return error to caller
		            res.writeHead(500, {'Content-Type': 'application/json'});
		            res.write(JSON.stringify({error: customerProfileError}));
		            res.end();
		        } else {

		        	req.session.customer = cognitoUser;
			        
					// Return response to caller
		            res.writeHead(201, {'Content-Type': 'application/json'});
		            res.write(JSON.stringify(customerProfile));
		            res.end();
		        }
		    });
		}
	});
});

//
// DELETE '/customer/session' - Sign-out currently authenticated user
app.delete('/customer/session', function (req, res) {

    // Log request received
    console.log( "Received request: DELETE /customer/session" );

	console.log("Found session (id="+req.sessionID+").");
	
	// Destroy session in memory
	req.session.destroy(function (deleteSessionMemError) {

		if(deleteSessionMemError) {

			console.log("!ERROR! - Failed to delete session (id="+req.sessionID+") in memory: "+deleteSessionDbError);
			
    		// Return error to caller
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.write('Failed to delete session (id='+req.sessionID+') in memory: '+deleteSessionDbError);
			res.end();
			return;
		} else {

			console.log("Destroyed session (id="+req.sessionID+").");

			// Return success to caller
            res.writeHead(204, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({session: undefined}));
			res.end();
			return;
		}
	});
});

function profileCustomer(customer, callback) {

	console.log("Profiling customer: "+JSON.stringify(customer));
	customer.getUserAttributes(function(error, result) {
        if(error) {
        	
        	console.log("!ERROR! - Couldn't get user attributes: "+error);
        	callback(error, null);
        } else {
	    	var customerProfile = {};
	    	
	    	var customerProfileBuffer = '{';
	        for(var attribute of result) {

	        	var key = attribute.getName().Name;
	        	var value = attribute.getName().Value;
	        	customerProfileBuffer += '"'+key+'":'+((value.startsWith('{') && value.endsWith('}')) ? value : '"'+value+'"')+',';
	        }
	        if(customerProfileBuffer.endsWith(',')) {
	        	customerProfileBuffer = customerProfileBuffer.substring(0, customerProfileBuffer.length-1);
	        }
	        customerProfileBuffer += '}';
	    	console.log("Customer Profile: "+customerProfileBuffer);
	        customerProfile = JSON.parse(customerProfileBuffer);
	    	console.log("Customer profile loaded");
	    	callback(null, customerProfile);
        }
	});
}

//
// GET - cart API - Get entire cart for current user
app.get('/cart/:id', function (req, res) {

        // Log request received
        console.log( "Received request: GET /cart/"+req.params.id );

        loadCart(req.params.id, function (cartError, existingCart) {

        	// Handle error
        	if(cartError) {
        		
        		// Throw 'cart not found' response to caller
				res.writeHead(404, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(cartError));
				res.end();
				return;
        	} else {

        		// Return cart items to caller
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(existingCart));
				res.end();
				return;
        	}
        });
});

//
// DELETE - cart API - Get entire cart for current user
app.delete('/cart/:id', function (req, res) {

        // Log request received
        console.log( "Received request: DELETE /cart/"+req.params.id );

        deleteCart(req.params.id, function (deleteCartError) {

        	// Handle error
        	if(deleteCartError) {
				
				// Cart does not exist - create and store cart
				console.log("Unexpected error: "+deleteCartError);
        		
        		// Throw 'cart not found' response to caller
				res.writeHead(404, {'Content-Type': 'application/json'});
				res.write(deleteCartError);
				res.end();
				return;
        	} else {

        		// Return cart items to caller
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify({cart: null}));
				res.end();
				return;
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

    var timestamp = new Date().getTime().toString();
    var newCartItem = req.body.newCartItem;

    console.log("Requested new cart item: "+JSON.stringify(newCartItem));
    
	if(req.params.id != 0 && req.params.id != 'undefined') {
		
		// Cart exists - load cart
		console.log("Try to load cart (id: "+req.params.id+").");
		
		// Load existing cart
		loadCart(req.params.id, function (loadCartError, customerCart) {

			// Handle error
			if(loadCartError) {
				
				// Cart does not exist - create and store cart
				console.log("Unexpected error: "+loadCartError);

				// Return error to caller
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write('Failed to load cart id "'+req.params.id+'": '+loadCartError);
				res.end();
				return;
			} else {

				if(!customerCart) {
	
					// Cart does not exist - create and store cart
					console.log("Cart does not exist - create and store cart");
	
					// Create new cart
					var customerCart = {
						id: req.params.id,
						items: [newCartItem]
					}
					console.log("Cart created: "+JSON.stringify(customerCart))
				} else {
	
					console.log("Cart found: "+JSON.stringify(customerCart))
				}
				
				// Add new cart item to cart
				customerCart.items.push(newCartItem);
	
		    	// Store cart into data source
		    	storeCart(customerCart, function (storeCartError) {
		    		if(storeCartError) {
	
		    			console.log("Error: "+storeCartError);
		    			
			    		// Return error to caller
			            res.writeHead(500, {'Content-Type': 'application/json'});
			            res.write('Failed to store cart id "'+customerCart.id+'": '+storeCartError);
						res.end();
						return;
		    		} else {
	
		    			console.log("Cart stored successfully.");
		    			
		    			// Return new cart item to caller
		    			res.writeHead(201, {'Content-Type': 'application/json', 'CartId': customerCart.id, Location: 'https://'+restDomain+'/cart/'+customerCart.id+'/item/'+newCartItem.id});
		    			res.write(JSON.stringify(newCartItem));
		    			res.end();
		    			return;
		    		}
		    	});
			}
		});
	} else {

		// Return error to caller
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.write('Failed to load cart id "'+req.params.id+'": No cart specified.');
		res.end();
		return;
	}
});

//
// Load specified cart from the data source
function loadCart(cartId, callback) {

	// Create load params
	if(!cartId || cartId == 0) {

		callback('No cart specified', null);
		return;
	} else {

		// Cart id specified, create params
		var params = {
			TableName: 'SuroorFashionsCarts_'+srvEnvKey.toUpperCase(),
            ExpressionAttributeValues: {':c': cartId},
			FilterExpression: 'id = :c'
		};

		console.log("Searching for existing cart with: "+JSON.stringify(params));
		// Perform product load action
		dddc.scan(params, function (err, cartData) {
	
			if(err) {
	
				// Return error to caller
				callback(err, null);
			} else {
	
				// Log loaded  cart
				console.log("Loaded cart data: "+JSON.stringify(cartData));
	
				// Check only one cart loaded.
				if(cartData.Items.length == 0) {
					
					callback(null, null);
					return;
				} else if(cartData.Items.length > 1) {

					callback('More than one cart found for: '+cartId, null);
					return;
				} else {

					// Return  cart to caller
					callback(null, cartData.Items[0]);
					return;
				}
			}
		});
	}
}

//
// Delete specified cart from the data source
function deleteCart(cartId, callback) {

	// Create load params
	if(!cartId || cartId == 0) {

		callback('No cart specified');
		return;
	} else {

		// Cart id specified, create params
		var params = {
			TableName: 'SuroorFashionsCarts_'+srvEnvKey.toUpperCase(),
            Key: {id: cartId}
		};

		console.log("Deleting existing cart with: "+JSON.stringify(params));
		// Perform product delete action
		dddc.delete(params, function (err, cartData) {
	
			if(err) {
	
				console.log("Failed to delete cart id '"+cartId+"'. "+err);
				// Return error to caller
				callback('Failed to delete cart id "'+cartId+'. '+err);
			} else {
	
				// Log loaded  cart
				console.log("Deleted cart data: "+JSON.stringify(cartData));
	
				// Return  cart to caller
				callback(null);
				return;
			}
		});
	}
}

//
// Store cart into the data source
function storeCart(cart, callback) {

	// Create params for cart 'store' operation
	var storeCartParams = {
		TableName: 'SuroorFashionsCarts_'+srvEnvKey.toUpperCase(),
		Item: cart
	};

	// Log contents of dynamo db store operation
	console.log("Uploading cart with: "+ JSON.stringify(storeCartParams));

	// Perform product store operation
	dddc.put(storeCartParams, function (err, data) {
		if (err) {

			console.log("Failed to store cart id '"+cart.id+"'. "+err);
			callback('Failed to store cart id "'+cart.id+'. '+err, null);
			return;
		} else {

			// Log output from data store
			console.log("Data returned from data store: "+JSON.stringify(data));

			callback(null);
		}
	});
}

//
// GET '/client_token' - Generate a client token for the payment gateway
/*
app.get('/client_token', function (req, res) {

    // Log request received
    console.log( "Received request: GET /client_token" );

    gateway.clientToken.generate({}, function (err, response) {
    	if(err) {

    		console.log("Got payment gateway client token error: "+err);
    		
    		// Return new cart item to caller
    		res.writeHead(500, {'Content-Type': 'application/json'});
    		res.write(JSON.stringify({error: err}));
    		res.end();
    		return;
    	} else {

			console.log("Got payment gateway client token.");
			
			// Return new cart item to caller
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({environment: environment.toLowerCase(), clientToken: response.clientToken}));
			res.end();
			return;
    	}
    });
});
*/

//
// POST '/create-payment' - Create a payment transaction
app.post('/create-payment', function (req, res) {

	// Log request received
	console.log( "Received request: POST /create-payment" );

	console.log("Request: "+JSON.stringify(req.body));
	var customer = req.body.customer; 
	if(!customer) {

		console.log("No customer specified: "+customer);
		
		// Return error to caller
		res.writeHead(400, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({error: 'No customer specified.'}));
		res.end();
		return;
	} else {

		console.log("Loading cart belonging to customer: "+customer);

		customer = JSON.parse(customer);
		// Load cart using customer id
        loadCart(customer.sub, function (cartError, cart) {

			// Handle error
			if(cartError) {
        		
				console.log("Cart not found: "+cartError);

				// Throw 'cart not found' response to caller
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify({error: cartError}));
				res.end();
				return;
        	} else {

				console.log("Cart found");
	
				if(!cart || !cart.items || cart.items.length == 0) {

					console.log("Cart is empty");

					// Throw 'cart not found' response to caller
					res.writeHead(404, {'Content-Type': 'application/json'});
					res.write(JSON.stringify({error: 'Cart is empty'}));
					res.end();
					return;
				} else {

					var totalItems = 0;
					var totalAmount = 0.00;
					var totalTax = 0.00;
					var orderItems = [];
					// Get cart details for customer
					for(var item of cart.items) {

						var itemAmount = (parseFloat(item.cost) * 0.8);
						var itemTax = (parseFloat(item.cost) * 0.2);
						totalAmount += itemAmount;
						totalTax += itemTax;
						totalItems += item.quantity;
						
						orderItems.push({
							name: item.productName,
							description: item.description,
							quantity: item.quantity,
							price: itemAmount.toFixed(2),
							tax: itemTax.toFixed(2),
							sku: "1",
							currency: "USD"
						});
					}

					var orderId = new Date().getTime().toString().split('').reverse().join('').substring(0,14);
					var descriptor = 'SuroorF'+'*'+orderId;
					
					// Payment object
					var newPayment = {
						intent: 'sale',
						'payer': {
							payment_method: 'paypal'	  
						},
						transactions: [{
							amount: {
								total: (totalAmount + totalTax).toFixed(2),
								currency: "USD",
								details: {
									subtotal: totalAmount.toFixed(2),
									tax: totalTax.toFixed(2),
									shipping: '0.00',
									handling_fee: '0.00',
									shipping_discount: '0.00',
									insurance: '0.00'
								}
							},
							description: totalItems+' item(s), Total = $'+totalAmount,
							custom: null,
							invoice_number: orderId,
							payment_options: {
								allowed_payment_method: 'INSTANT_FUNDING_SOURCE'
							},
							soft_descriptor: null,
							item_list: {
								items: orderItems,
								shipping_address: {
									recipient_name: customer.given_name+' '+customer.family_name,
									line1: customer.address.line1,
									line2: customer.address.line2,
									city: customer.address.city,
									country_code: 'US',
									postal_code: customer.address.zip,
									phone: customer.address.phone_number,
									state: customer.address.state
								}
							}
						}],
						note_to_payer: 'Contact us for any questions on your order.',
						redirect_urls: {
							return_url: 'https://'+restHost+'/return',
							cancel_url: 'https://'+restHost+'/cancel'
						}
					}

					var authToken = new Buffer(process.env.PGW_CLIENT+':'+process.env.PGW_SECRET).toString('base64');
					var headers = {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': 'Basic '+authToken
					}
					console.log("headers: "+JSON.stringify(headers));
					request.post({url: 'https://'+paymentDomain+'/v1/oauth2/token', headers: headers, body: 'grant_type=client_credentials'}, function (accessError, accessResponse, accessBody) {

						if (accessError) {

							console.log("Error details: "+accessError);

							// Return error to caller
							res.writeHead(500, {'Content-Type': 'application/json'});
							res.write(JSON.stringify({error: accessError}));
							res.end();
							return;
						} else {

							console.log("Got access response: "+JSON.stringify(accessResponse));
							console.log("Got access body: "+accessBody);

							console.log("Sending form-data: "+JSON.stringify(newPayment));

							request.post({url: 'https://'+paymentDomain+'/v1/payments/payment', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer '+JSON.parse(accessBody).access_token}, body: JSON.stringify(newPayment)}, function (paymentError, paymentResponse, paymentBody) {
		
								if (paymentError) {
		
									console.log("Error details: "+paymentError);
		
									// Return error to caller
									res.writeHead(500, {'Content-Type': 'application/json'});
									res.write(JSON.stringify({error: paymentError}));
									res.end();
									return;
								} else {
		
									console.log("Got payment response: "+JSON.stringify(paymentResponse));
									console.log("Got payment body: "+paymentBody);

									var response = {paymentID: JSON.parse(paymentBody).id}
									console.log("Returning to caller: "+JSON.stringify(response));
									// Return error to caller
									res.writeHead(201, {'Content-Type': 'application/json'});
									res.write(JSON.stringify(response));
									res.end();
									return;
								}
							});
						}
					});
				}
			}
		});
	}
});

//
// POST '/execute-payment' - Create a payment transaction
app.post('/execute-payment', function (req, res) {

	// Log request received
	console.log( "Received request: POST /execute-payment" );

	console.log("Request: "+JSON.stringify(req.body));

	var authToken = new Buffer(process.env.PGW_CLIENT+':'+process.env.PGW_SECRET).toString('base64');
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'Basic '+authToken
	}
	console.log("headers: "+JSON.stringify(headers));
	request.post({url: 'https://'+paymentDomain+'/v1/oauth2/token', headers: headers, body: 'grant_type=client_credentials'}, function (accessError, accessResponse, accessBody) {

		if (accessError) {

			console.log("Error details: "+accessError);

			// Return error to caller
			res.writeHead(500, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({error: accessError}));
			res.end();
			return;
		} else {

			console.log("Got access response: "+JSON.stringify(accessResponse));
			console.log("Got access body: "+accessBody);

			request.post({url: 'https://'+paymentDomain+'/v1/payments/payment/'+req.body.paymentID+'/execute', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer '+JSON.parse(accessBody).access_token}, body: JSON.stringify({'payer_id': req.body.payerID})}, function (paymentError, paymentResponse, paymentBody) {

				if (paymentError) {

					console.log("Error details: "+paymentError);

					// Return error to caller
					res.writeHead(500, {'Content-Type': 'application/json'});
					res.write(JSON.stringify({error: paymentError}));
					res.end();
					return;
				} else {

					console.log("Got payment response: "+JSON.stringify(paymentResponse));
					console.log("Got payment body: "+paymentBody);

					paymentBody = JSON.parse(paymentBody);

					if(paymentBody.state != 'approved') {
						
						// Return error to caller
						res.writeHead(500, {'Content-Type': 'application/json'});
						res.write(JSON.stringify({error: 'Incomplete payment: state='+paymentBody.state+', ref='+req.body.paymentID}));
						res.end();
						return;
					} else {

				        deleteCart(req.body.customer.sub, function (deleteCartError) {

				        	// Handle error
				        	if(deleteCartError) {
								
								// Cart does not exist - create and store cart
								console.log("Unexpected error: "+deleteCartError);
				        		
				        		// Throw 'cart not found' response to caller
								res.writeHead(404, {'Content-Type': 'application/json'});
								res.write(deleteCartError);
								res.end();
								return;
				        	} else {

								console.log("Returning to caller: "+JSON.stringify(response));

								// Return success to caller
								res.writeHead(201, {'Content-Type': 'application/json'});
								res.write(JSON.stringify({paymentID: paymentBody.id, state: paymentBody.state}));
								res.end();
								return;
				        	}
				        });
					}
				}
			});
		}
	});
});

//
// Store order into the data source
function storeOrder(order, callback) {

	// Create params for cart 'store' operation
	var storeOrderParams = {
		TableName: 'SuroorFashionsOrders_'+environment,
		Item: order
	};

	// Log contents of dynamo db store operation
	console.log("Uploading order with: "+ JSON.stringify(storeOrderParams));

	// Perform order store operation
	dddc.put(storeOrderParams, function (err, data) {
		if (err) {

			console.log("!ERROR! - "+err);
			callback(err);
			return;
		} else {

			// Log output from data store
			console.log("Data returned from data store: "+JSON.stringify(data));

			callback(null);
		}
	});
}
