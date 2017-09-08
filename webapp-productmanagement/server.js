//
//
// Product Management Web Site
//
//

//
// Manage environment
var express = require('express');
var http = require('http');
var https = require('https');
var request = require('request');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')
var replaceall = require("replaceall");
var util = require('util');
var events = require('events');

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
var upload = multer({ dest: '/tmp/'});
var key = fs.readFileSync('certs/domain.key');
var cert = fs.readFileSync('certs/domain.crt');
var options = {
	key: key,
	cert: cert
};
var productDomain = 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com:444';
/* #################### REMOVE THIS ONCE TRUSTED CERT IS INSTALLED ON REST API ############### */
agent = new https.Agent({
  host: 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com'
, port: '444'
, path: '/'
, rejectUnauthorized: false
});



//
// Create and run web server
/*
var server = app.listen(8081, function() {

	// Output server endpoint
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
});
*/
// http.createServer(options, app).listen(81);
https.createServer(options, app).listen(8444);

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

		console.log("!!!!!!!!!!!!!!!!!! "+util.inspect(req.body));

                // Update existing product
                updateExistingProduct(req, res, function (productStoreErrorMessage, updatedProduct) {


                        // Load existing products
                        loadExistingProducts(req, res, function (productLoadErrorMessage, productsList) {

                                // Add dynamic elements to response page
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
// Create new product
function loadExistingProducts(req, res, callback) {

	console.log("Connecting to: "+'https://'+productDomain+'/product');
	request.get({url:'https://'+productDomain+'/product', agent: agent}, function (productLoadError, productLoadResponse, productLoadBody) {
		if (productLoadError) callback('Failed to load existing products.', null);

                // Log error from remote server
                console.log( "REST API server responded with 'err': " + productLoadError );
		// Log status code from remote server
		console.log( "REST API server responded with 'status': " + productLoadResponse.statusCode );
		// Log response body from remote server
		console.log( "REST API server responded with 'body': " + productLoadBody );

                // Error handling
                if(productLoadResponse.statusCode != '200') {
			callback('Failed to load existing products.', null);
                }

		callback(null, JSON.parse(productLoadBody));
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
	request.post({url:'https://'+productDomain+'/product/'+id+'/image', formData: {image_files: imageArray}, agent: agent}, function (imageStoreError, imageStoreResponse, imageStoreBody) {

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
				colors: JSON.parse(req.body.colors),
				sizes: JSON.parse(req.body.sizes),
	        		creationTimestamp: timestamp,
	                        lastUpdateTimestamp: timestamp,
				promoted: req.body.promoted
	        	};

		        // Log new product object
        		console.log( "New Product: " + JSON.stringify(newProduct) );

			// Store product 
			request.post({url:'https://'+productDomain+'/product', formData: {product: JSON.stringify(newProduct)}, agent: agent}, function (productStoreError, productStoreResponse, productStoreBody) {
                		if (productStoreError) callback('Failed to store new product.', null);

	                	// Log error from remote server
	        	        console.log( "REST API server responded with 'err': " + productStoreError );
        	        	// Log status code from remote server
	        	        console.log( "REST API server responded with 'status': " + productStoreResponse.statusCode );
        	        	// Log response body from remote server
		                console.log( "REST API server responded with 'body': " + productStoreBody );

				// Error handling
				if(productStoreResponse.statusCode != '200') {
					callback('Failed to store new product.', null);
				}

				callback(null, newProduct);
			});
		// }
	// });
}

//
// Update existing product
function updateExistingProduct(req, res, callback) {

        // Capture update timestamp
        var timestamp = new Date().getTime().toString();

	// Create new product object
	var updatedProduct = {
		id: req.body.id,
		name: req.body.name,
		type: req.body.type,
		description: req.body.description,
		price: req.body.price,
		colors: JSON.parse(req.body.colors),
                sizes: JSON.parse(req.body.sizes),
		images: JSON.parse(req.body.images),
		creationTimestamp: timestamp,
		lastUpdateTimestamp: timestamp,
		promoted: req.body.promoted
	};

	// Log new product object
	console.log( "Updated Product: " + JSON.stringify(updatedProduct) );

	// Store product
	request.put({url:'https://'+productDomain+'/product/'+updatedProduct.id, formData: {product: JSON.stringify(updatedProduct)}, agent: agent}, function (productStoreError, productStoreResponse, productStoreBody) {
		if (productStoreError) callback('Failed to store existing product.', null);

		// Log error from remote server
		console.log( "REST API server responded with 'err': " + productStoreError );
		// Log status code from remote server
		console.log( "REST API server responded with 'status': " + productStoreResponse.statusCode );
		// Log response body from remote server
		console.log( "REST API server responded with 'body': " + productStoreBody );

		// Error handling
		if(productStoreResponse.statusCode != '200') {
			callback('Failed to store existing product.', null);
		}

		callback(null, updatedProduct);
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
                request.put({url:'https://'+productDomain+'/product/'+updatedProduct.id, formData: {product: JSON.stringify(updatedProduct)}, agent: agent}, function callback(productStoreError, productStoreResponse, productStoreBody) {
                        if (productStoreError) throw productStoreError;

                        // Log status code from remote server
                        console.log( "Server responded with: " + productStoreResponse.statusCode );
                        // Log response body from remote server
                        console.log( "Server responded with: " + productStoreBody );

                        request.get({url:'https://'+productDomain+'/product', agent: agent}, function callback(productLoadError, productLoadResponse, productLoadBody) {
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
		request.put({url:'https://'+productDomain+'/product/'+req.body.id+'/image', formData: {image_files: imageArray}, agent: agent}, function callback(imageStoreError, imageStoreResponse, imageStoreBody) {
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
// var multiparty = require('multiparty');
var AWS = require('aws-sdk');
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
// Create S3 service object
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

        // Fetch updated products list
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
// Upload new or existing product
function storeProduct(product, callback) {

        // Create params for product 'store' operation
        var storeProductParams = {
                TableName: 'SuroorFashionsProducts',
        	Item: product
        };

	// Log contents of dynamo db store operation
        console.log("Uploading product with: "+ JSON.stringify(storeProductParams));

        // Perform product store operation
	dddc.put(storeProductParams, function (err, data) {
                if (err) {
                        callback('Failed to store product(s)', null);
                } else {

			// Log output from data store
			console.log("Data returned from data store: "+JSON.stringify(data));

	                // Return product details to caller
        	        callback(null, JSON.stringify(data));
		}
	});
}

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
// Upload an array of images to content store
function storeImages(productId, imageFiles, callback) {

	// Log image path
	console.log("New Image List: "+JSON.stringify(imageFiles));

	if(imageFiles.length > 0) {

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
	} else if(imageFile.length == 1) {

		// Upload image
		storeImage(productId, imageFile, function (imageStoreError, uploadedImage) {

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
			TableName: 'SuroorFashionsProducts',
			Limit: 10,
                        ExpressionAttributeValues: {':p': productId},
			FilterExpression: 'id = :p'
		};
	} else {
                params = {
                        TableName: 'SuroorFashionsProducts',
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

