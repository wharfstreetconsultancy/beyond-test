//
// Import required libraries
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')
var AWS = require('aws-sdk');
var jq = require('node-jq');
var ddbAv = require('dynamodb-data-types').AttributeValue;

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).single('filetoupload'));

//
// Manage AWS API
var dynamodb = new AWS.DynamoDB({
	apiVersion: '2012-08-10'
});

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
		productId: {S: timestamp},
      	productName: {S: req.body.product_name},
		productType: {S: 'CLOTHING'},
		description: {S: req.body.product_description},
		imageLocation: {S: req.file.path},
		creationTimestamp: {N: timestamp}
  	};

	// Log new product
	console.log( "New Product: " + JSON.stringify(newProduct) );

	// Store new products
	storeNewProduct( newProduct, function (existingProductsList) {
		// Log existing product list
		console.log( "Updated Products List: " + JSON.stringify(existingProductsList) );

		// Add dynamic elements to response page
		formatProductHtml(existingProductsList, function(formattedProductHtml) {
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Product ('+newProduct.name+') added successfully at '+new Date(newProduct.creationTimestamp).toISOString().replace(/T/, ' ').replace(/\..+/, ''))+'<br>Please provide more product details')
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

	// Perform load command
	dynamodb.scan(params, function(err, fileData) {
		if(err) throw err;
		console.log("Loaded: "+JSON.stringify(fileData));
		jq.run('.Items', fileData, {input: 'json', output: 'json'})
			.then((existingProductsList) => {

				// Return existing product list to caller
				callback(ddbAv.unwrap(existingProductsList));
			})
			.catch((err) => {
				console.log("Oops!");
				throw err;	});
	});
}

//
// Store new product in the data source
function storeNewProduct(newProduct,callback) {

	// Create products file if it doesn't exist
	loadExistingProducts(function (existingProductsList) {
console.log("What have we here: "+existingProductsList);
		// Add new product to existing product list
		existingProductsList.push(newProduct);

		// Create search params
		var params = {
			TableName: 'SuroorFashionsProducts',
			Item: newProduct
		};

		// Perform store command
		dynamodb.putItem(ddbAv.wrap(params), function(err, data) {
			if(err) throw err;
			console.log("Stored: "+JSON.stringify(data));

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