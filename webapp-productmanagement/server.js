//
// Import required libraries
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')
var AWS = require('aws-sdk');
var jq = require('node-jq');

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).single('filetoupload'));

//
// Manage AWS API
/*var dynamodb = new AWS.DynamoDB({
	apiVersion: '2012-08-10'
});*/
var dddc = new AWS.DynamoDB.DocumentClient();

//
// Create and run server
var server = app.listen(8081, function() {

	// Output server endpoint
	console.log('Example app listening at http://'+server.address().address+':'+server.address().port+'/');
})

//
// GET - root context - serve index page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );

	// Store new products
	loadExistingProducts(function (existingProductsList) {
		// Log existing product list
		console.log( "Existing Products List: " + JSON.stringify(existingProductsList) );

		// Add dynamic elements to response page
		formatProductHtml(existingProductsList, function(formattedProductHtml) {
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Please provide product details'))
	.pipe(replaceStream('{existing.products.list}', formattedProductHtml))
				.pipe(res);
		});
	});
})

//
// POST - root context - capture and process product details
app.post('/', function (req, res) {

	// Log request received
	console.log( "Received request: POST /" );

	var timestamp = new Date().getTime().toString();
	// Create product object
	var newProduct = {
		productId: timestamp,
      	productName: req.body.product_name,
		productType: 'CLOTHING',
		description: req.body.product_description,
		imageLocation: req.file.path,
		creationTimestamp: timestamp
  	};

	// Log new product
	console.log( "New Product: " + JSON.stringify(newProduct) );

	// Store new products
	storeNewProduct( newProduct, function (existingProductsList) {
		// Log existing product list
		console.log( "Updated Products List: " + JSON.stringify(existingProductsList) );

		// Add dynamic elements to response page
		formatProductHtml(existingProductsList, function(formattedProductHtml) {
			console.log("Product Name: "+JSON.stringify(newProduct.productName));
			console.log("Timestamp: "+JSON.stringify(newProduct.creationTimestamp));
			fs.createReadStream(__dirname+'/index.html')
//				.pipe(replaceStream('{user.prompt}', 'Product ('+JSON.stringify(newProduct.name)+') added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, ''))+'<br>Please provide more product details')
				.pipe(replaceStream('{existing.products.list}', formattedProductHtml))
				.pipe(res);
		});
	});
})

//
// Load existing products from the data source
function loadExistingProducts(callback) {

	// Create search params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Limit: 10,
		ExpressionAttributeValues: {
			':c': {S: 'CLOTHING'}
		},
		FilterExpression: 'productType = :c'
	};
	console.log("About to load with: "+JSON.stringify(params));
	// Perform load command
	dddc.scan(params, function(err, fileData) {
		if(err) throw err;

		existingProductsList = fileData.Items;
		console.log("Loaded: "+JSON.stringify(existingProductsList));

		// Return existing product list to caller
		callback(existingProductsList);

/*
		jq.run('.Items', fileData, {input: 'json', output: 'json'})
			.then((existingProductsList) => {

				// Return existing product list to caller
				callback(existingProductsList);
			});
		});
*/
	});
}

//
// Store new product in the data source
function storeNewProduct(newProduct,callback) {

	// Create search params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Item: newProduct
	};
	console.log("About to store with: "+JSON.stringify(params));
	// Perform store command
	dddc.put(params, function(err, data) {
		if(err) throw err;

		console.log("Stored: "+JSON.stringify(data));



		// Fetch latest existing products list
		loadExistingProducts(function (existingProductsList) {
			console.log("Latest list: "+JSON.stringify(existingProductsList));

			// Return to caller
			callback(existingProductsList);
		});
	});
}

//
// Load existing products from the data source
function checkForFile(fileName,callback)
{
	// Check if file exists
	fs.exists(fileName, function (exists) {

		if(exists) {
			// File already exists - return
			callback();
		} else {
			// Create file
			fs.open(fileName, 'w+', function (err, data) { 
				if(err) throw err;
				// File created - return
				callback();
			})
		}
	});
}

//
// Format response with existing products list
function formatProductHtml(existingProductsList,callback) {

	// Initialise HTML section
	var formattedProductHtml = '';

	// If there are any existing products
	if(existingProductsList.length > 0) {

		// Open list element
		formattedProductHtml += '<ul>';

		// Iterate through existing product list
		for(var product of existingProductsList) {

			// Write product in list item element
			formattedProductHtml += '<li>';
			formattedProductHtml += JSON.stringify(product.productName);
			formattedProductHtml += '</li>';
		}

		// Close list element
		formattedProductHtml += '</ul>';
	} else {

		// Provide default message
		formattedProductHtml += 'No product exists';
	}

	// Return to caller
	callback(formattedProductHtml);
}