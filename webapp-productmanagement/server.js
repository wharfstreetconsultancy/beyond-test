//
//
// Product Management Web Site
//
//

//
// Manage environment
var express = require('express');
var session = require('express-session');
var DynamoDBStore = require('connect-dynamodb')({session: session});
var http = require('http');
var https = require('https');
var request = require('request');
var fs = require('fs');
var multer = require('multer');
var bodyParser = require('body-parser');
var replaceStream = require('replacestream')
var replaceall = require("replaceall");
var util = require('util');
var events = require('events');
var AWS = require('aws-sdk');
var sha256 = require('sha256');

var environment = process.env.ENVIRONMENT.toUpperCase();
console.log("ENVIRONMENT="+environment);

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.json({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: process.env.SESSION_SECRET,
	store: new DynamoDBStore({AWSConfigJSON: {region: process.env.AWS_REGION}, table: 'SuroorFashionsSessionsAdmins_'+environment}),
	resave: false,
	saveUninitialized: true,
	cookie: {secure: true}
}));
var upload = multer({ dest: '/tmp/'});
var key = fs.readFileSync('certs/domain.key');
var cert = fs.readFileSync('certs/domain.crt');
var options = {
	key: key,
	cert: cert
};
var securePort = process.env.SECURE_PORT;
var allowedOriginPort = process.env.ALLOWED_ORIGIN_PORT;
var restPort = process.env.REST_PORT;
var restHost = 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com';
var restDomain = restHost+':'+restPort;
var allowedOriginDomain = restHost+((allowedOriginPort && allowedOriginPort.length > 0) ? ':'+allowedOriginPort : '');

/* #################### REMOVE THIS ONCE TRUSTED CERT IS INSTALLED ON REST API ############### */
agent = new https.Agent({
	host: restHost,
	port: restPort,
	path: '/',
	rejectUnauthorized: false
});

var authDomain = 'suroor-fashions-admins.auth.us-west-2.amazoncognito.com';
var authClientId = '';
var authClientSecret = '';

//
// Create and run web server
http.createServer(app).listen(8081);
https.createServer(options, app).listen(8444);

//
// ALL '*' - Redirect all http traffic to https
app.all('*', function (req, res, next) {

	// Determine if request was https
	if(req.connection.encrypted) {
/*
		console.log("Req Session: "+util.inspect(req.session));
		console.log("Req URL: "+util.inspect(req.url));
		console.log("Req Headers: "+util.inspect(req.headers));
		console.log("Req Query: "+JSON.stringify(req.query));
*/
		next();







/*
var cognitoUser = userPool.getCurrentUser();
if (cognitoUser != null) {
cognitoUser.getSession(function(err, session) {
if (err) {console.log("ERR: could not get session");}

console.log("Session found: "+JSON.stringify(session));
                next();
});
}
*/







/*
		var codeVerifier = new Buffer(authClientSecret+'us-east-1_TcoKGbf7n'+authClientId).toString('Base64');
		console.log("Code verifier: "+codeVerifier);
		// Request was https - check if it was authenticated
                if(!req.query.code) {

			var codeChallenge = new Buffer(sha256(codeVerifier)).toString('Base64');
			// Request was not authenticated - redirect to login page
			var authUrl = 'https://'+authDomain+'/login?response_type=code&client_id='+authClientId+'&redirect_uri=https://'+restDomain+req.url+'&code_challenge_method=S256&code_challenge='+codeChallenge;
			console.log("Redirecting http request to: "+authUrl);
			res.redirect(authUrl);
		} else {





			var authUrl = 'https://'+authDomain+'/oauth2/token';
			var formData = {
				'Content-Type': 'application/x-www-form-urlencoded',
				code: req.query.code,
				Authorization: 'Base '+new Buffer(authClientId+':'+authClientSecret).toString('Base64'),
				grant_type: 'authorization_code',
				client_id: authClientId,
				redirect_uri: 'https://'+restDomain+req.path,
				code_verifier: codeVerifier
			}
			console.log("Exchanging tokens using: "+JSON.stringify(formData)+' @ '+authUrl);
			request.put({url: authUrl, formData: formData}, function (tokenExchangeError, tokenExchangeResponse, tokenExchangeBody) {
				if (tokenExchangeError) {
					console.log("Error: "+tokenExchangeError);
                                        res.writeHead(500, 'Failed to exchange tokens for code: '+req.query.code);
                                        res.end();
				}

				// Log error from remote server
				console.log( "REST API server responded with 'err': " + tokenExchangeError );
				// Log status code from remote server
				console.log( "REST API server responded with 'status': " + tokenExchangeResponse.statusCode );
				// Log response body from remote server
				console.log( "REST API server responded with 'body': " + tokenExchangeBody );

				// Error handling
				if(tokenExchangeResponse.statusCode != '200') {
					res.writeHead(tokenExchangeResponse.statusCode, 'Failed to exchange tokens for code: '+req.query.code);
					res.end();
				} else {




					next();
				}
			});
		}
*/
	} else {

		// Request was http - redirect caller to https
        var secureUrl = 'https://'+req.host+':'+securePort+req.url
        console.log("Redirecting http request to: "+secureUrl);
		res.redirect(secureUrl);
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

		// Add dynamic elements to response page
		formatProductHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {

			// Add dynamic elements to response page
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{onload.action}', ''))
				.pipe(replaceStream('{user.prompt}', (productLoadErrorMessage) ? productLoadErrorMessage: 'Please provide product details.'))
				.pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
				.pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
				.pipe(res);
		});
	});
});


//
// POST '/' - Create, update or delete product
app.post('/', upload.array('image_files'), function (req, res) {

	// Log request received
	console.log( "Received request: POST /" );

	// Determine required action
	var action = req.body.action.toLowerCase();

	// Log requested action
	console.log( "Requested action: " + action );

	if(action == 'create') {

		// Create new product
		createNewProduct(req, res, function (productStoreErrorMessage, newProduct) {

			// Load existing products
			loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {

				// Add dynamic elements to response page
				formatProductHtml(productsList, function (productsListClothingHtml, productsListJewelleryHtml) {
				
				        // Add dynamic elements to response page
				        fs.createReadStream(__dirname+'/index.html')
				                .pipe(replaceStream('{onload.action}', (newProduct) ? 'selectProduct(JSON.parse(document.getElementById('+newProduct.id+').value));' : ''))
				                .pipe(replaceStream('{user.prompt}', (productStoreErrorMessage) ? productStoreErrorMessage : 'Product '+JSON.stringify(newProduct.name)+' added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'. Please provide more product details...'))
				                .pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
				                .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
				                .pipe(res);
				});
			});
		});
	} else if(action == 'update') {

                // Update existing product
                updateExistingProduct(req, res, function (productStoreErrorMessage, updatedProduct) {

                        // Load existing products
                        loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {

                                // Format products into appropriate HTML
                                formatProductHtml(productsList, function(productsListClothingHtml, productsListJewelleryHtml) {

                                        // Add dynamic elements to response page
                                        fs.createReadStream(__dirname+'/index.html')
                                                .pipe(replaceStream('{onload.action}', 'selectProduct(JSON.parse(document.getElementById('+updatedProduct.id+').value));'))
                                                .pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(updatedProduct.name)+' updated successfully at '+new Date(parseInt(updatedProduct.lastUpdateTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'. Please provide more product details...'))
                                                .pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
                                                .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
                                                .pipe(res);
                                });
                        });
		});
	} else if(action == 'delete') {

                // Delete existing product
                deleteExistingProduct(req, res);
	}
});

//
// Load existing product from datasource
function loadExistingProducts(req, res, callback) {

	console.log("Connecting to: "+'https://'+restDomain+'/product');
	request.get({url:'https://'+restDomain+'/product', agent: agent}, function (productLoadError, productLoadResponse, productLoadBody) {
		
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
// Create new product
function createNewProduct(req, res, callback) {

	// Capture creation timestamp
	var timestamp = new Date().getTime().toString();

	// Generate product ID
	var id = timestamp.split("").reverse().join("");

	var imageArray = [];
	if(req.files) {
		for(var file of req.files) {
			imageArray.push(fs.createReadStream(file.path));
		}
	}

	// Store product images
/*
	request.post({url:'https://'+restDomain+'/product/'+id+'/image', formData: {image_files: imageArray}, agent: agent}, function (imageStoreError, imageStoreResponse, imageStoreBody) {

                // Log error from remote server
                console.log( "REST API server responded with 'err': " + imageStoreError );
		// Log status code from remote server
                console.log( "REST API server responded with 'status': " + imageStoreResponse.statusCode );
		// Log response body from remote server
		console.log( "REST API server responded with 'body':" + imageStoreBody );

		// Error handling
		if(imageStoreResponse.statusCode != '200') {
			console.log("Existing product creation process as image failed to upload.");
			callback('Failed to load product image for new product (name: '+req.body.name+').', null);
		} else {
*/
		        // Create new product object
	        	var newProduct = {
        	        	id: id,
	        	        name: req.body.name,
        	        	type: req.body.type,
	                	description: req.body.description,
	                	price: req.body.price,
	                	colors: (req.body.colors != 'undefined') ? JSON.parse(req.body.colors) : [],
	                	sizes: (req.body.sizes != 'undefined') ? JSON.parse(req.body.sizes) : [],
	                	creationTimestamp: timestamp,
	                	lastUpdateTimestamp: timestamp,
	                	promoted: req.body.promoted
	        	};

		        // Log new product object
        		console.log( "New Product: " + JSON.stringify(newProduct) );

			// Store product 
			request.post({url:'https://'+restDomain+'/product', formData: {product: JSON.stringify(newProduct)}, agent: agent}, function (productStoreError, productStoreResponse, productStoreBody) {
                
				if (productStoreError) {
					
					callback(productStoreError, null);
				} else {

                	// Log error from remote server
	                console.log( "REST API server responded with 'err': " + productStoreError );
	                // Log status code from remote server
	                console.log( "REST API server responded with 'status': " + productStoreResponse.statusCode );
	                // Log response body from remote server
	                console.log( "REST API server responded with 'body': " + productStoreBody );
	
					// Error handling
					if(productStoreResponse.statusCode != '200') {
						
						callback(productStoreBody, null);
					} else {	
						
						callback(null, newProduct);
					}
				}
			});
		// }
	// });
}

//
// Update existing product
function updateExistingProduct(req, res, callback) {

	// Capture update timestamp
	var timestamp = new Date().getTime().toString();

	console.log( "Updated Product: " + ((req.body.images != 'undefined') ? req.body.images : '[]'));

	// Create new product object
	var updatedProduct = {
		id: req.body.id,
		name: req.body.name,
		type: req.body.type,
		description: req.body.description,
		price: req.body.price,
    	colors: (req.body.colors != 'undefined') ? JSON.parse(req.body.colors) : [],
       	sizes: (req.body.sizes != 'undefined') ? JSON.parse(req.body.sizes) : [],
		images: (req.body.images != 'undefined') ? JSON.parse(req.body.images) : [],
		creationTimestamp: timestamp,
		lastUpdateTimestamp: timestamp,
		promoted: req.body.promoted
	};

	// Log new product object
	console.log( "Updated Product: " + JSON.stringify(updatedProduct) );

	// Store product
	request.put({url:'https://'+restDomain+'/product/'+updatedProduct.id, formData: {product: JSON.stringify(updatedProduct)}, agent: agent}, function (productStoreError, productStoreResponse, productStoreBody) {

		if (productStoreError) {

			callback(productStoreError, null);
		} else {

			// Log error from remote server
			console.log( "REST API server responded with 'err': " + productStoreError );
			// Log status code from remote server
			console.log( "REST API server responded with 'status': " + productStoreResponse.statusCode );
			// Log response body from remote server
			console.log( "REST API server responded with 'body': " + productStoreBody );
	
			// Error handling
			if(productStoreResponse.statusCode != '200') {
				
				callback(productStoreBody, null);
			} else {
	
				callback(null, updatedProduct);
			}
		}
	});


/*
        // Capture update timestamp
        var timestamp = new Date().getTime().toString();

        // Create a product image update observer object
        var imageObserver = new events.EventEmitter();

        // Update product
        imageObserver.on('update_product', function(imageLocation) {
                // Create new product object
                var updatedProduct = {
                        id: req.body.id,
                        name: req.body.name,
                        type: req.body.type,
                        description: req.body.description,
                        price: req.body.price,
                        images: [
				((imageLocation) ? imageLocation : req.body.imageLocation)
			],
                        creationTimestamp: req.body.creationTimestamp,
                        lastUpdateTimestamp: timestamp,
                        promoted: req.body.promoted
                };

                // Log updated product object
                console.log( "Updated Product: " + JSON.stringify(updatedProduct) );

                // Store product
                request.put({url:'https://'+restDomain+'/product/'+updatedProduct.id, formData: {product: JSON.stringify(updatedProduct)}, agent: agent}, function callback(productStoreError, productStoreResponse, productStoreBody) {
                        if (productStoreError) throw productStoreError;

                        // Log status code from remote server
                        console.log( "Server responded with: " + productStoreResponse.statusCode );
                        // Log response body from remote server
                        console.log( "Server responded with: " + productStoreBody );

                        request.get({url:'https://'+restDomain+'/product', agent: agent}, function callback(productLoadError, productLoadResponse, productLoadBody) {
                                if (productLoadError) throw productLoadError;

                                // Log status code from remote server
                                console.log( "Server responded with: " + productLoadResponse.statusCode );
                                // Log response body from remote server
                                console.log( "Server responded with: " + productLoadBody );

                                // Add dynamic elements to response page
                                formatProductHtml(JSON.parse(productLoadBody), function(productsListClothingHtml, productsListJewelleryHtml) {

                                        // Add dynamic elements to response page
                                        fs.createReadStream(__dirname+'/index.html')
                                                .pipe(replaceStream('{onload.action}', 'selectProduct(JSON.parse(document.getElementById('+updatedProduct.id+')));'))
                                                .pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(updatedProduct.name)+' updated successfully at '+new Date(parseInt(updatedProduct.lastUpdateTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'<br>Please provide more product details'))
                                                .pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
                                                .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
                                                .pipe(res);
                                });
                        });
		});
        });

	if(req.files) {
		console.log("New Images: "+JSON.stringify(req.files));
                console.log("Existing Images: "+JSON.stringify(req.body));

		var imageArray = [];
		for(var file of req.files) {
			imageArray.push(fs.createReadStream(file.path));
		}
		// Update image if specified
		request.put({url:'https://'+restDomain+'/product/'+req.body.id+'/image', formData: {image_files: imageArray}, agent: agent}, function callback(imageStoreError, imageStoreResponse, imageStoreBody) {
	                if (imageStoreError) throw imageStoreError;

	                // Log status code from remote server
        	        console.log( "Server responded with: " + imageStoreResponse.statusCode );
                	// Log response body from remote server
	                console.log( "Server responded with: " + imageStoreBody );

			imageObserver.emit('update_product', imageStoreBody);
		});
	} else {
		// Trigger product update
                imageObserver.emit('update_product');
	}
*/
}

//
// Delete existing product
function deleteExistingProduct(req, res) {

}

//
// Format products list into HTML
function formatProductHtml(productsList, callback) {

	// Initialise clothing HTML section
	var productsListClothingHtml = '';
	// Initialise jewellery HTML section
	var productsListJewelleryHtml = '';

	if(productsList) {

		// Iterate through product list
		for(var product of productsList) {
	
			// Initialise product HTML buffer with product name
			var currentProductHtml = replaceall('"','', JSON.stringify(product.name));
	
			if(product.promoted == 'true') {
				// If product is being promoted, indicate with asterisk
				currentProductHtml += '**';
			}
	
	                // Write product into radio box choice element
	                currentProductHtml = '<div id=\''+product.id+'_div\'><input id=\''+product.id+'\' type=\'radio\' name=\'product\' value=\''+JSON.stringify(product)+'\' onclick=\'selectProduct(JSON.parse(this.value));\'> '+currentProductHtml+'</input><br>Created on...<br></div>';
	
			if(product.type == 'CLOTHING') {
	
				// Add product to clothing list
				productsListClothingHtml += currentProductHtml;
			} else if (product.type == 'JEWELLERY') {
	
	                        // Add product to jewellery list
	                        productsListJewelleryHtml += currentProductHtml;
			}
		}
	}

	// If there are no clothing products
	if(productsListClothingHtml.length == 0) {
	
		// Provide default message for clothing list
		productsListClothingHtml = 'No clothing exists';
	}
	
	// If there are no jewellery products
	if(productsListJewelleryHtml.length == 0) {
	
		// Provide default message for jewellery list
		productsListJewelleryHtml = 'No jewellery exists';
	}

	// Return to caller
	callback(productsListClothingHtml, productsListJewelleryHtml);
}










//
//
// Product API Operations
//
//

//
// Manage environment
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//
// GET - product API - get all products
app.get('/product', function (req, res) {

	// Log request received
	console.log( "Received request: GET /product" );

	// Fetch updated products list
	loadProduct(null, function (loadProductError, existingProductsList) {

		// Return existing product list to caller
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(existingProductsList));
		res.end();
	});
});

//
// GET - product API - get specific product
app.get('/product/:id', function (req, res) {

        // Log request received
        console.log( "Received request: GET /product/"+req.params.id );

        // Fetch products list
        loadProduct(req.params.id, function (loadProductError, existingProduct) {

                // Return existing product list to caller
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(existingProduct));
                res.end();
        });
});

//
// POST - product API - Create new product details
app.post('/product', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: POST /product" );

        // Upload product
        storeProduct(JSON.parse(req.body.product), function(productStoreError, newProduct) {

                if(productStoreError) {

                        // Return existing product list to caller
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.write(productStoreError);
                        res.end();
                } else {

	                // Return product details to caller
        	        res.end(JSON.stringify(newProduct));
		}
	});
});

//
// PUT - product API - Update existing product details
app.put('/product/:id', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: PUT /product/"+req.params.id );
console.log("Headers: "+JSON.stringify(req.headers));
console.log("Body: "+JSON.stringify(req.body));
console.log("Query: "+JSON.stringify(req.query));
console.log("Params: "+JSON.stringify(req.params));
// for(var header of req.headers) {
// console.log("Header: "+JSON.stringify(header));
// }
console.log("Done");
	// Upload product
	storeProduct(JSON.parse(req.body.product), function(productStoreError, newProduct) {

                if(productStoreError) {

                        // Return existing product list to caller
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.write(productStoreError);
                        res.end();
                } else {

                        // Return product details to caller
                        res.end(JSON.stringify(newProduct));
                }
	});
});

//
// POST - product API - Create new product image
app.post('/product/:id/image', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: POST /product/"+req.params.id+"/image" );

        // Get specified product
        loadProduct(req.params.id, function (productLoadError, product) {

		if(productLoadError) {

	                // Return existing product list to caller
        	        res.writeHead(404, {'Content-Type': 'application/json'});
                	res.write('Product ('+req.params.id+') not found');
	                res.end();
		} else {

	        	// Upload image
		        storeImages(req.params.id, req.files, function (imageStoreError, uploadedImages) {

		                if(imageStoreError) {

		                        // Return failure message to caller
		                        res.writeHead(500, {'Content-Type': 'application/json'});
		                        res.write(imageStoreError);
		                        res.end();
		                } else {

					var uploadedImage = uploadedImages[0];

	                        	// Update product with new image
					if(!product.images) {
						product.images = [];
						uploadedImage.isDefault = true;
					}
					product.images.push(uploadedImage);

					storeProduct(product, function (productStoreError, updatedProduct) {

				                if(productStoreError) {

				                        // Return existing product list to caller
				                        res.writeHead(500, {'Content-Type': 'application/json'});
				                        res.write(productStoreError);
				                        res.end();
				                } else {

	                                                // Return uploaded image locations to caller
        	                                        res.writeHead(200, {'Content-Type': 'application/json'});
                	                                res.write(JSON.stringify(uploadedImage));
                        	                        res.end();
				                }
					});
				}
			});
		}
        });
});

//
// PUT - product API - Updates existing product image
app.put('/product/:id/image', upload.array('image_files'), function (req, res) {

	// Log request received
	console.log( "Received request: PUT /product/"+req.params.id+"/image" );

        // Upload image
        storeImages(req.params.id, req.files);
});

//
// Upload new or existing product
function storeProduct(product, callback) {
		
        // Create params for product 'store' operation
	var storeProductParams = {
			TableName: 'SuroorFashionsProducts_'+environment,
			Item: product
	};

	// Log contents of dynamo db store operation
	console.log("Uploading product with: "+ JSON.stringify(storeProductParams));

	// Perform product store operation
	dddc.put(storeProductParams, function (err, data) {
		if (err) {
			callback('Failed to store product named "'+product.name+'"', null);
		} else {

			// Log output from data store
			console.log("Data returned from data store: "+JSON.stringify(data));

			// Return product details to caller
			callback(null, JSON.stringify(data));
		}
	});
}

//
// Upload an array of images to content store
function storeImages(productId, imageFiles, callback) {

	// Log image path
	console.log("New Image List: "+JSON.stringify(imageFiles));

	if((imageFiles) && (imageFiles.length > 0)) {

        	// Declare array of uploaded image locations for output
	        var uploadedImages = [];

		// Iterate through image files
		for(var imageFile of imageFiles) {

                        // Upload image
                        storeImage(productId, imageFile, function (imageStoreError, uploadedImage) {

                                if(imageStoreError) {

                                        // Return failure message to caller
                                        callback(imageStoreError, null);
                                } else {

                                        // Add store image location to output array
                                        uploadedImages.push(uploadedImage);

                                        if(uploadedImages.length == imageFiles.length) {

                                                // Log success to console
                                                console.log("All images uploaded successfully");

                                                // Return uploaded image locations to caller
                                                callback(null, uploadedImages);
                                        }
				}
                        });
                }
	} else if(imageFiles.length == 1) {

		// Upload image
		storeImage(productId, imageFiles[0], function (imageStoreError, uploadedImage) {

			if(imageStoreError) {

				// Return failure message to caller
				callback(imageStoreError, null);
			} else {

				// Return uploaded image locations to caller
				callback(null, uploadedImage);
			}
		});
        } else {

                // Report empty input to caller
                callback('No files found in input stream', null);
        }
}

//
// Upload an image to content store
function storeImage(productId, imageFile, callback) {

	if(imageFile) {

		// Create params for image 'store' operation
		var storeImageParams = {
			Bucket: 'suroor.fashions.products',
			Key: productId+'/'+imageFile.path.split('/')[2],
			Body: fs.createReadStream(imageFile.path)
		}
		console.log("Uploading image: "+imageFile.path+" to storage path: "+storeImageParams.Key);
		// Store images at data source
		s3.upload(storeImageParams, function (err, data) {

			if (err) {

				callback('Failed to store product image(s)', null);
			} else {

				// New product image
				var uploadedImage = {
					isDefault: false,
					location: data.Location,
					tag: storeImageParams.Key.split('/')[1]
				}

				console.log("Created image: "+JSON.stringify(uploadedImage));

				// Return uploaded image to caller
				callback(null, uploadedImage);
			}
		});
	} else {

		// Report empty input to caller
		callback('No file found in input stream', null);
	}
}

//
// Get all products from the product catalog
function loadProduct(productId, callback) {

	var params;
	// Create load params
	if(productId) {
		params = {
			TableName: 'SuroorFashionsProducts_'+environment,
			Limit: 10,
			ExpressionAttributeValues: {':p': productId},
			FilterExpression: 'id = :p'
		};
	} else {
        params = {
	        TableName: 'SuroorFashionsProducts_'+environment,
	        Limit: 10
        };
	}
	console.log("Searching for existing products with: "+JSON.stringify(params));
	// Perform product load action
	dddc.scan(params, function (err, productsData) {
		if(err) {

			// Return error to caller
			callback('Failed to load product(s)', null);
		} else {

			if(productId) {

				// If product ID was specified then a single product is expected
				product = productsData.Items[0];
			} else {

				// Select only product items from output
				product = productsData.Items;
			}

			// Log loaded products list
			console.log("Loaded product data: "+JSON.stringify(product));

			// Return products list to caller
			callback(null, product);
		}
	});
}
