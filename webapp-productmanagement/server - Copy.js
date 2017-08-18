//
// Import required libraries
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var replaceStream = require('replacestream')
var aws = require('aws-sdk');

//
// Create and run server
var server = app.listen(8081, function() {

	// Output server endpoint
	console.log('Example app listening at http://'+server.address().address+':'+server.address().port+'/');

	// Set AWS profile
	AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'suroor-fashions/webapp-productmanagement'});

	AWS.config.apiVersions = {
		dynamodb: '2012-08-10',
	};

	var dynamodb = new AWS.DynamoDB();
})

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).single('filetoupload'));

//
// GET - root context - serve index page
app.get('/', function (req, res) {

	// Log request received
	console.log( "Received request: GET /" );
	// Serve index page
	// res.sendFile( __dirname + "/" + "index.html" );

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

	// Create product object
	var newProduct = {
      	name:req.body.product_name,
		description:req.body.product_description,
		imageLocation:req.file.path,
		creationDate:new Date().getTime()
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
				.pipe(replaceStream('{user.prompt}', 'Product ('+newProduct.name+') added successfully at '+new Date(newProduct.creationDate).toISOString().replace(/T/, ' ').replace(/\..+/, ''))<br>Please provide more product details)
				.pipe(replaceStream('{existing.products.list}', formattedProductHtml))
				.pipe(res);
		});
	});
})

//
// Load existing products from the data source
function loadExistingProducts(callback) {

	// Create products file if it doesn't exist
	checkForFile("/tmp/products", function () {

		// Load all products from data source
		fs.readFile('/tmp/products', function(err, data) {
			if(err) throw err;

			// Create existing product list from file
			var existingProducts = [];
			if(data.length > 0) {
				// Only parse if file contains data
				existingProducts = JSON.parse(data.toString());
			}

			// Return existing product list to caller
			callback(existingProducts);
		});
	});
}

//
// Store new product in the data source
function storeNewProduct(newProduct,callback) {

	// Create products file if it doesn't exist
	loadExistingProducts(function (existingProducts) {

		// Add new product to existing product list
		existingProducts.push(newProduct);

		// Save updated product list to data source
		fs.writeFile("/tmp/products", JSON.stringify(existingProducts), function(err) {
			if(err) throw err;

			// Return to caller
			callback(existingProducts);
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
			formattedProductHtml += product.name;
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