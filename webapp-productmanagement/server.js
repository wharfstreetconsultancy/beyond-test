//
//
// Product Management Web Site
//
//

//
// Manage environment
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).single('filetoupload'));

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

	var loadReq = http.request(loadProductParams, function(error, response, body) {
		console.log("Just returned!!!! "+JSON.stringify(response));
		// if (err) throw err;

		// Log existing product list
		console.log( "Server responded with: " + JSON.stringify(response) + " - " + error.toString() + " - " + JSON.stringify(body) );

		var existingProductList = body.products;
		// Add dynamic elements to response page
		formatProductHtml(existingProductList, function(productsListHtml) {
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Please provide product details'))
	.pipe(replaceStream('{products.list}', productsListHtml))
				.pipe(res);
		});
	});
	// loadReq.on('error', function(error) {
        	// throw error;
	// });
	loadReq.end();
});


//
// POST - web site - capture and process product details
app.post('/', function (req, res) {

	// Log request received
	console.log( "Received request: POST /" );

	// Capture creation timestamp
	var timestamp = new Date().getTime().toString();

	// Create new product object
	var newProduct = {
		productId: timestamp,
      	productName: req.body.product_name,
		productType: 'CLOTHING',
		description: req.body.product_description,
		imageLocation: req.file.path,
		creationTimestamp: timestamp
  	};

	// Log new product object
	console.log( "New Product: " + JSON.stringify(newProduct) );



	// Params for load operation
	var storeProductParams = {
		host: 'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com/',
		port: 81,
		path: '/product',
		method: 'GET',
		headers:{
			'Content-Type': 'multipart/form-data'
		},
		body:{
			newProduct: newProduct,
			image: fs.createReadStream(newProduct.imageLocation)
		}
	};



	// Store new product object in DB
	storeNewProduct( newProduct, function (updatedProductsList) {

		// Log updated products list
		console.log( "Updated Products List: " + JSON.stringify(updatedProductsList) );

		// Add dynamic elements to response page
		formatProductHtml(updatedProductsList, function(productsListHtml) {

			// Add dynamic elements to response page
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(newProduct.productName)+' added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'<br>Please provide more product details'))
				.pipe(replaceStream('{products.list}', productsListHtml))
				.pipe(res);
		});
	});
});

//
// Store new product into the product catalog
function storeNewProduct(newProduct,callback) {

	// Create params for image 'store' operation
	var storeImageParams = {
		Bucket: 'suroor.fashions.products',
		Key: newProduct.productId+'/main',
		Body: fs.createReadStream(newProduct.imageLocation).on('error', function(err) {
  console.log('File Error', err);
})
	};
	console.log("Uploading with: ", storeImageParams);
	// Perform image store action
	s3.upload(storeImageParams, function (err, data) {
		if (err) throw err;

		console.log("Upload Success", data.Location);
		newProduct.imageLocation = data.Location;

		// Create params for product 'store' operation
		var storeProductParams = {
			TableName: 'SuroorFashionsProducts',
			Item: newProduct
		};
		console.log("Uploading with: ", storeProductParams);
		// Perform product store action
		dddc.put(storeProductParams, function (err, data) {
			if(err) throw err;

			// Fetch updated products list
			loadExistingProducts(function (updatedProductsList) {

				// Return to caller
				callback(updatedProductsList);
			});
		});
	});
}

//
// Format products list into HTML
function formatProductHtml(productsList,callback) {

	// Initialise HTML section
	var productsListHtml = '';

	// If there are any existing products
	if(productsList.length > 0) {

		// Open list element
		productsListHtml += '<ul>';

		// Iterate through product list
		for(var product of productsList) {

			// Write product in list item element
			productsListHtml += '<li>';
			productsListHtml += JSON.stringify(product.productName);
			productsListHtml += '</li>';
		}

		// Close list element
		productsListHtml += '</ul>';
	} else {

		// Provide default message
		productsListHtml += 'No product exists';
	}

	// Return to caller
	callback(productsListHtml);
}










//
//
// Product API Operations
//
//

//
// Manage environment
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
app.post('/product', function (req, res) {

	// Log request received
	console.log( "Received request: POST /product" );


	// Create params for image 'store' operation
	var storeImageParams = {
		Bucket: 'suroor.fashions.products',
		Key: newProduct.productId+'/main',
		Body: fs.createReadStream(newProduct.imageLocation).on('error', function(err) {
  console.log('File Error', err);
})
	};
	console.log("Uploading with: ", storeImageParams);
	// Perform image store action
	s3.upload(storeImageParams, function (err, data) {
		if (err) throw err;

		console.log("Upload Success", data.Location);
		newProduct.imageLocation = data.Location;

		// Create params for product 'store' operation
		var storeProductParams = {
			TableName: 'SuroorFashionsProducts',
			Item: newProduct
		};
		console.log("Uploading with: ", storeProductParams);
		// Perform product store action
		dddc.put(storeProductParams, function (err, data) {
			if(err) throw err;

			// Fetch updated products list
			loadExistingProducts(function (updatedProductsList) {

				// Return updated product list to caller
				res.end(JSON.stringify(updatedProductsList));
			});
		});
	});
});

//
// Get all products from the product catalog
function loadAllProducts(callback) {

	// Create load params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Limit: 10,
		ExpressionAttributeValues: {
			':c': 'CLOTHING'
		},
		FilterExpression: 'productType = :c'
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

