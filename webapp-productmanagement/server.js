//
//
// Product Management Web Site
//
//

//
// Manage environment
var express = require('express');
var http = require('http');
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

//
// Create and run web server
var server = app.listen(8081, function() {

	// Output server endpoint
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
});

//
// GET '/' - Initial home page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );

	//
	// Load all existing products from REST API

	// Params for load operation
	var loadProductParams = {
		host: 'ec2-52-10-1-150.us-west-2.compute.amazonaws.com',
		port: 81,
		path: '/product',
		method: 'GET',
		headers:{
			'Content-Type': 'application/json'
		}
	};

	// Call to REST API to load existing products
	var loadReq = http.request(loadProductParams, function(response) {

                // Log status code from remote server
                console.log( "Server responded with: " + response.statusCode );

                // Set encoding for output
                response.setEncoding('utf8');

                // Output buffer`
                var output = '';

		// Next chunk of output received
		response.on('data', function (chunk) {
			// Append to output buffer
			output += chunk;
		});

		// All output received
		response.on('end', function() {

			// Log response body from remote server
			console.log( "Server responded with: " + output );

			// Parse response body into existing products list
			var existingProductList = JSON.parse(output);

        	        // Dynamically add existing products list to response page and send to caller
	                formatProductHtml(existingProductList, function(productsListClothingHtml, productsListJewelleryHtml) {
                        	fs.createReadStream(__dirname+'/index.html')
                                        .pipe(replaceStream('{onload.action}', ''))
                	                .pipe(replaceStream('{user.prompt}', 'Please provide product details'))
        				.pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
                                        .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
        	                        .pipe(res);
	                });
		});
	});
	loadReq.on('error', function(error) {
        	throw error;
	});
	loadReq.end();
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
		createNewProduct(req, res);
	} else if(action == 'update') {

                // Update existing product
                updateExistingProduct(req, res);
	} else if(action == 'delete') {

                // Delete existing product
                deleteExistingProduct(req, res);
	}
});

//
// Create new product
function createNewProduct(req, res) {

	// Capture creation timestamp
	var timestamp = new Date().getTime().toString();

	// Generate product ID
	var id = timestamp.split("").reverse().join("");

	var imageArray = [];
	if(req.files) {
		for(var file of req.files) {
			imageArray.push(createReadStream(file.path));
		}
	}

	// Store product image
	request.post({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product/'+id+'/image', formData: {image_files: imageArray}}, function callback(imageStoreError, imageStoreResponse, imageStoreBody) {
		if (imageStoreError) throw imageStoreError;

		// Log status code from remote server
                console.log( "Server responded with: " + imageStoreResponse.statusCode );
		// Log response body from remote server
		console.log( "Server responded with: " + imageStoreBody );

	        // Create new product object
        	var newProduct = {
                	id: id,
	                name: req.body.name,
        	        type: req.body.type,
                	description: req.body.description,
			price: req.body.price,
               		imageLocation: imageStoreBody,
	        	creationTimestamp: timestamp,
                        lastUpdateTimestamp: timestamp,
			promoted: req.body.promoted
	        };

	        // Log new product object
        	console.log( "New Product: " + JSON.stringify(newProduct) );

		// Store product 
		request.post({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product', formData: {product: JSON.stringify(newProduct)}}, function callback(productStoreError, productStoreResponse, productStoreBody) {
                	if (productStoreError) throw productStoreError;

                	// Log status code from remote server
	                console.log( "Server responded with: " + productStoreResponse.statusCode );
        	        // Log response body from remote server
	                console.log( "Server responded with: " + productStoreBody );

			request.get({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product'}, function callback(productLoadError, productLoadResponse, productLoadBody) {
	                        if (productLoadError) throw productLoadError;

                        	// Log status code from remote server
                	        console.log( "Server responded with: " + productLoadResponse.statusCode );
        	                // Log response body from remote server
	                        console.log( "Server responded with: " + productLoadBody );
		
				// Add dynamic elements to response page
				formatProductHtml(JSON.parse(productLoadBody), function(productsListClothingHtml, productsListJewelleryHtml) {

					// Add dynamic elements to response page
					fs.createReadStream(__dirname+'/index.html')
	                                        .pipe(replaceStream('{onload.action}', 'handleClick(findProduct('+newProduct.id+'));'))
						.pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(newProduct.name)+' added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'<br>Please provide more product details'))
	                                        .pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
        	                                .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
                                		.pipe(res);
				});
			});
	        });
	});
}

//
// Update existing product
function updateExistingProduct(req, res) {

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
                request.put({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product/'+updatedProduct.id, formData: {product: JSON.stringify(updatedProduct)}}, function callback(productStoreError, productStoreResponse, productStoreBody) {
                        if (productStoreError) throw productStoreError;

                        // Log status code from remote server
                        console.log( "Server responded with: " + productStoreResponse.statusCode );
                        // Log response body from remote server
                        console.log( "Server responded with: " + productStoreBody );

                        request.get({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product'}, function callback(productLoadError, productLoadResponse, productLoadBody) {
                                if (productLoadError) throw productLoadError;

                                // Log status code from remote server
                                console.log( "Server responded with: " + productLoadResponse.statusCode );
                                // Log response body from remote server
                                console.log( "Server responded with: " + productLoadBody );

                                // Add dynamic elements to response page
                                formatProductHtml(JSON.parse(productLoadBody), function(productsListClothingHtml, productsListJewelleryHtml) {

                                        // Add dynamic elements to response page
                                        fs.createReadStream(__dirname+'/index.html')
                                                .pipe(replaceStream('{onload.action}', 'handleClick(findProduct('+updatedProduct.id+'));'))
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

/*
		var imageArray = [];
		for(var file of req.files) {
			imageArray.push(fs.createReadStream(file.path));
		}
		// Update image if specified
		request.put({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product/'+req.body.id+'/image', formData: {image_files: imageArray}}, function callback(imageStoreError, imageStoreResponse, imageStoreBody) {
	                if (imageStoreError) throw imageStoreError;

	                // Log status code from remote server
        	        console.log( "Server responded with: " + imageStoreResponse.statusCode );
                	// Log response body from remote server
	                console.log( "Server responded with: " + imageStoreBody );

			imageObserver.emit('update_product', imageStoreBody);
		});
*/
	} else {
		// Trigger product update
                imageObserver.emit('update_product');
	}
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
                currentProductHtml = '<input id=\''+product.id+'\' type=\'radio\' name=\'product\' value=\''+JSON.stringify(product)+'\' onclick=\'handleClick(this);\'> '+currentProductHtml+'</input><br>Created on...<br>';

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
	loadAllProducts(function (existingProductsList) {
		// Return existing product list to caller
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(existingProductsList));
		res.end();
	});
});

//
// POST - product API - Create new product details
app.post('/product', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: POST /product" );

        // Upload product
        uploadProduct(req, res);
});

//
// PUT - product API - Update existing product details
app.put('/product/:id', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: PUT /product/"+req.params.id );

	// Upload product
	uploadProduct(req, res);
});

//
// Upload new or existing product
function uploadProduct(req, res) {

	// Parse request body into new product object
	var product = JSON.parse(req.body.product);

        // Create params for product 'store' operation
        var storeProductParams = {
                TableName: 'SuroorFashionsProducts',
        	Item: product
        };

	// Log contents of dynamo db store operation
        console.log("Uploading product with: "+ JSON.stringify(storeProductParams));

        // Perform product store operation
	dddc.put(storeProductParams, function (err, data) {
                if(err) throw err;

		// Log output from data store
		console.log("Data returned from data store: "+JSON.stringify(data));

                // Return product details to caller
                res.end(JSON.stringify(product));
	});
}

//
// POST - product API - Create new product image
app.post('/product/:id/image', upload.array('image_files'), function (req, res) {

        // Log request received
        console.log( "Received request: POST /product/"+req.params.id+"/image" );

	// Upload image
	uploadImage(req, res);
});

//
// PUT - product API - Updates existing product image
app.put('/product/:id/image', upload.array('image_files'), function (req, res) {

	// Log request received
	console.log( "Received request: PUT /product/"+req.params.id+"/image" );

        // Upload image
        uploadImage(req, res);
});

//
// Upload image to content store
function uploadImage(req, res) {
	// Log image path
        console.log("New Image: "+JSON.stringify(req.files));
	console.log("New Image: "+JSON.stringify(req.files));
/*
	// Create params for image 'store' operation
	var storeImageParams = {
		Bucket: 'suroor.fashions.products',
		Key: req.params.id+'/'+req.file.path.split('/')[2],
		Body: fs.createReadStream(req.file.path).on('error', function(err) {
  console.log('File Error', err);
})
	};
	console.log("Uploading image: "+req.file.path+" to storage path: "+storeImageParams.Key);
	// Perform image store action
	s3.upload(storeImageParams, function (err, data) {
		if (err) throw err;

		console.log("Upload Success", data.Location);

                // Return updated product list to caller
		res.end(data.Location);
	});
*/
}

//
// Get all products from the product catalog
function loadAllProducts(callback) {

	// Create load params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Limit: 10
	};

	// Perform product load action
	dddc.scan(params, function(err, productsData) {
		if(err) throw err;

		// Select only product items from output
		productsList = productsData.Items;

		// Log loaded products list
		console.log("Loaded: "+JSON.stringify(productsList));

		// Return products list to caller
		callback(productsList);
	});
}

