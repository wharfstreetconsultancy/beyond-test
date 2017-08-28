//
// Import required libraries
var express = require('express');
var fs = require('fs');
var request = require('request');
var replaceStream = require('replacestream')
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

	request.get({url:'http://ec2-52-10-1-150.us-west-2.compute.amazonaws.com:81/product'}, function callback(productLoadError, productLoadResponse, productLoadBody) {
                if (productLoadError) throw productLoadError;

                // Log status code from remote server
                console.log( "Server responded with: " + productLoadResponse.statusCode );
                // Log response body from remote server
                console.log( "Server responded with: " + productLoadBody );

		// Parse response body into existing products list
                // var updatedProductsList = JSON.parse(output);

                // Log existing product list
                // console.log( "Existing Products List: " + JSON.stringify(existingProductsList) );

                // Add dynamic elements to response page
                formatProductHtml(JSON.parse(productLoadBody), function(clothingCarouselHtml, jewelleryCarouselHtml) {
                        fs.createReadStream(__dirname+'/index.html')
			        .pipe(replaceStream('{showcase.clothing.carousel}', clothingCarouselHtml))
                                .pipe(replaceStream('{showcase.jewellery.carousel}', jewelleryCarouselHtml))
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

function formatProductHtml(productsList,callback) {

        // Initialise clothing HTML section
        var productsListClothingHtml = '';
        // Initialise jewellery HTML section
        var productsListJewelleryHtml = '';

        // Iterate through product list
        for(var product of productsList) {

		if(product.promoted == 'true') {

		        // Initialise current buffer
        		var currentBuffer = '';

	                // Write product in showcase carousel element
        	        currentBuffer += '<div class="col-md-3 col-sm-6 hero-feature">'
                	currentBuffer += '<div class="thumbnail">'
	                currentBuffer += '<img src="'+product.imageLocation+'" alt="">'
        	        currentBuffer += '<div class="caption">'
                	currentBuffer += '<h3>'+product.name+'</h3>'
	                currentBuffer += '<p/>'
        	        currentBuffer += '<p><a href="#" class="btn btn-primary disabled">View Product</a></p>'
                	currentBuffer += '</div>'
	                currentBuffer += '</div>'
        	        currentBuffer += '</div>'

                	if(product.type == 'CLOTHING') {

	                        // Write product into clothing list
        	                productsListClothingHtml += currentBuffer;
                	} else if (product.type == 'JEWELLERY') {

                        	// Write product into jewellery list
	                        productsListJewelleryHtml += currentBuffer;
			}
                }
        }

console.log("Clothing buffer: "+productsListClothingHtml);
console.log("Jewellery buffer: "+productsListJewelleryHtml);

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

