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
// var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')
var util=require('util');

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
// app.use(bodyParser.urlencoded({ extended: false }));
var upload = multer({ dest: '/tmp/'});
// var parser = bodyParser.urlencoded({ extended: false });

//
// Create and run web server
var server = app.listen(8081, function() {

	// Output server endpoint
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
});

//
// GET - web site - index page
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
// POST - web site - capture and process product details
app.post('/', upload.single('filetoupload'), function (req, res) {

	// Log request received
	console.log( "Received request: POST /" );

	// Capture creation timestamp
	var timestamp = new Date().getTime().toString();

	var formData = {
		// Pass data via Streams
		filetoupload: fs.createReadStream(req.file.path)
	};
	request.post({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product/'+timestamp+'/image', formData: formData}, function callback(imageStoreError, imageStoreResponse, imageStoreBody) {
		if (imageStoreError) throw imageStoreError;

		// Log status code from remote server
                console.log( "Server responded with: " + imageStoreResponse.statusCode );
		// Log response body from remote server
		console.log( "Server responded with: " + imageStoreBody );

	        // Create new product object
        	var newProduct = {
                	id: timestamp,
	                name: req.body.name,
        	        type: req.body.type,
                	description: req.body.description,
			price: req.body.price,
               		imageLocation: imageStoreBody,
	        	creationTimestamp: timestamp,
			promoted: req.body.promoted
	        };

	        // Log new product object
        	console.log( "New Product: " + JSON.stringify(newProduct) );

		formData = {
                	// Send new product object
                	newProduct: JSON.stringify(newProduct)
		};

		request.post({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product', formData: formData}, function callback(productStoreError, productStoreResponse, productStoreBody) {
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
		
				// Parse response body into existing products list
				// var updatedProductsList = JSON.parse(output);

				// Add dynamic elements to response page
				formatProductHtml(JSON.parse(productLoadBody), function(productsListClothingHtml, productsListJewelleryHtml) {

					// Add dynamic elements to response page
					fs.createReadStream(__dirname+'/index.html')
						.pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(newProduct.name)+' added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'<br>Please provide more product details'))
	                                        .pipe(replaceStream('{products.list.clothing}', productsListClothingHtml))
        	                                .pipe(replaceStream('{products.list.jewellery}', productsListJewelleryHtml))
                                		.pipe(res);
				});
			});
	        });
	});
});

//
// Format products list into HTML
function formatProductHtml(productsList,callback) {

	// Initialise clothing HTML section
	var productsListClothingHtml = '';
        // Initialise jewellery HTML section
        var productsListJewelleryHtml = '';

	// Iterate through product list
	for(var product of productsList) {

		if(product.type == 'CLOTHING') {

			// Write product into clothing list
			productsListClothingHtml += '<li>'+JSON.stringify(product.name)+'</li>';
		} else if (product.type == 'JEWELLERY') {

                        // Write product into jewellery list
                        productsListJewelleryHtml += '<li>'+JSON.stringify(product.name)+'</li>';
		}
	}


        // If there are no clothing products
        if(productsListClothingHtml.length == 0) {

                // Provide default message for clothing list
                productsListClothingHtml = 'No clothing exists';
        } else {

                // Wrap list in a list container element
                productsListClothingHtml = '<ul>'+productsListClothingHtml+'</ul>';
	}

        // If there are no jewellery products
        if(productsListJewelleryHtml.length == 0) {

                // Provide default message for jewellery list
                productsListJewelleryHtml = 'No jewellery exists';
        } else {

		// Wrap list in a list container element
		productsListJewelleryHtml = '<ul>'+productsListJewelleryHtml+'</ul>';
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
// POST - product API - capture and process product details
app.post('/product', upload.single('filetoupload'), function (req, res) {

        // Log request received
        console.log( "Received request: POST /product" );

	// Parse request body into new product object
	var newProduct = JSON.parse(req.body.newProduct);

        // Create params for product 'store' operation
        var storeProductParams = {
                TableName: 'SuroorFashionsProducts',
        	Item: newProduct
        };

	// Log contents of dynamo db store operation
        console.log("Creating new product with: "+ JSON.stringify(storeProductParams));

        // Perform product store operation
	dddc.put(storeProductParams, function (err, data) {
                if(err) throw err;

		console.log("Data returned from dynamoDB: "+JSON.stringify(data));
                // Fetch updated products list
                // loadExistingProducts(function (updatedProductsList) {

                        // Return updated product list to caller
                        res.end(JSON.stringify(newProduct));
		// });
	});
});

//
// POST - product API - capture and process product details
app.post('/product/:productId/image', upload.single('filetoupload'), function (req, res) {

	// Log request received
	console.log( "Received request: POST /product/"+req.params.productId+"/image" );

	// Log image path
	console.log("Image: "+req.file.path);

	// Create params for image 'store' operation
	var storeImageParams = {
		Bucket: 'suroor.fashions.products',
		Key: req.params.productId+'/main',
		Body: fs.createReadStream(req.file.path).on('error', function(err) {
  console.log('File Error', err);
})
	};
	console.log("Uploading image: "+storeImageParams.Key);
	// Perform image store action
	s3.upload(storeImageParams, function (err, data) {
		if (err) throw err;

		console.log("Upload Success", data.Location);

                // Return updated product list to caller
		res.end(data.Location);
	});
});

//
// Get all products from the product catalog
function loadAllProducts(callback) {

	// Create load params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Limit: 10
		// ExpressionAttributeValues: {
			// ':c': 'CLOTHING'
		// },
		// FilterExpression: 'productType = :c'
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

