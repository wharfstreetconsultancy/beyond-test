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
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
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
		formatProductHtml(existingProductsList, function(productsListHtml) {
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Please provide product details'))
	.pipe(replaceStream('{products.list}', productsListHtml))
				.pipe(res);
		});
	});
})

//
// POST - root context - capture and process product details
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

	// Store new product object in DB
	storeNewProduct( newProduct, function (updatedProductsList) {

		// Log updated products list
		console.log( "Updated Products List: " + JSON.stringify(updatedProductsList) );

		// Add dynamic elements to response page
		formatProductHtml(updatedProductsList, function(productsListHtml) {

			// Add dynamic elements to response page
			fs.createReadStream(__dirname+'/index.html')
				.pipe(replaceStream('{user.prompt}', 'Product '+JSON.stringify(newProduct.name)+' added successfully at '+new Date(parseInt(newProduct.creationTimestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')+'<br>Please provide more product details'))
				.pipe(replaceStream('{products.list}', productsListHtml))
				.pipe(res);
		});
	});
})

//
// Load existing products from the data source
function loadExistingProducts(callback) {

	// Create load params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Limit: 10,
		ExpressionAttributeValues: {
			':c': 'CLOTHING'
		},
		FilterExpression: 'productType = :c'
	};

	// Perform load command
	dddc.scan(params, function(err, fileData) {
		if(err) throw err;

		// Select only product items from output
		existingProductsList = fileData.Items;

		// Log loaded products list
		console.log("Loaded: "+JSON.stringify(existingProductsList));

		// Return existing product list to caller
		callback(existingProductsList);
	});
}

//
// Store new product in the data source
function storeNewProduct(newProduct,callback) {

	// Create store params
	var params = {
		TableName: 'SuroorFashionsProducts',
		Item: newProduct
	};

	// Perform store command
	dddc.put(params, function (err, data) {
		if(err) throw err;

		// Fetch updated products list
		loadExistingProducts(function (updatedProductsList) {

			// Return to caller
			callback(updatedProductsList);
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