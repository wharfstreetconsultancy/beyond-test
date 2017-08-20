//
// Import required libraries
var express = require('express');
var AWS = require('aws-sdk');

//
// Manage HTTP server container
var app = express();
app.use(express.static('assets'));

//
// Manage AWS API
var dddc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
// Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//
// Create and run server
var server = app.listen(8080, function () {

	// Output server endpoint
	console.log('Product Management app listening at http://'+server.address().address+':'+server.address().port+'/');
})

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

	// Perform product load action
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
// Format products list into HTML
function formatProductHtml(productsList,callback) {

	// Initialise HTML section
	var productsListHtml = '';

	// If there are any existing products
	if(productsList.length > 0) {

		// Iterate through product list
		for(var product of productsList) {

			// Write product in showcase display element
			productsListHtml += <div class="col-md-3 col-sm-6 hero-feature">
			productsListHtml += <div class="thumbnail">
			productsListHtml += <img src="product.imageLocation" alt="">
			productsListHtml += <div class="caption">
			productsListHtml += <h3>product.productName</h3>
			productsListHtml += <p/>
			productsListHtml += <p><a href="#" class="btn btn-primary disabled">View Product</a></p>
			productsListHtml += </div>
			productsListHtml += </div>
			productsListHtml += </div>
		}
	} else {

		// Provide default message
		productsListHtml += 'No product exists';
	}

	// Return to caller
	callback(productsListHtml);
}
