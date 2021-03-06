<div class="body">
	<div class="container-fluid">
		<div class="col-lg-10 col-lg-offset-1">
			<div class="panel panel-primary">
				<div class="panel-heading">
					<div class="row">
						<div id="cart_title" class="col-lg-9"></div>
						<div id="cart_cost_summary" class="col-lg-3"></div>
					</div>
				</div>
				<div class="panel-body">
					<div class="row">
						<div id="paypal-button" class="col-lg-3"></div>
						<div id="clear_button" class="col-lg-1 col-lg-offset-8"></div>
					</div>
					<hr>
					<div id="cart_inventory" class="row"></div>
				</div>
				<div class="panel-footer"></div>
			</div>
		</div>
	</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.51/jquery.form.min.js"></script>
<script src="https://www.paypalobjects.com/api/checkout.js"></script>
<script>
var latestCart = {latest.cart};

$(document).ready(function() {

	document.getElementById("cart_title").innerHTML = 'Your Cart Items...';
	if(latestCart) {
		document.getElementById("clear_button").innerHTML += '<button type="reset" id="cart_clear" name="cart_clear" class="btn btn-primary pull-right">Clear</button>';
		document.getElementById("cart_inventory").innerHTML += '<div class="row">';
		document.getElementById("cart_inventory").innerHTML += '<div class="col-lg-1"><b>Qty</b></div><div class="col-lg-3"><b>Product</b></div><div class="col-lg-2"><b>Size</b></div><div class="col-lg-2"><b>Color</b></div><div class="col-lg-2"><b>Item Cost</b></div><div class="col-lg-2"><b>Line Cost</b></div>';
		document.getElementById("cart_inventory").innerHTML += '</div>';
		console.log("Latest cart: "+JSON.stringify(latestCart));
		var totalItems = 0;
		var totalCost = 0.00;
		for(var cartItem of latestCart.items) {
			
			totalItems += cartItem.quantity;
			var lineCost = (cartItem.cost * cartItem.quantity);
			totalCost += lineCost;
			document.getElementById("cart_inventory").innerHTML += '<div class="row">';
			document.getElementById("cart_inventory").innerHTML += '<div class="col-lg-1">'+cartItem.quantity+'</div><div class="col-lg-3">'+cartItem.productName+'</div><div class="col-lg-2">'+cartItem.size+'</div><div class="col-lg-2">'+cartItem.color+'</div><div class="col-lg-2">'+cartItem.cost.toFixed(2)+'</div><div class="col-lg-2">'+lineCost.toFixed(2)+'</div>';
			document.getElementById("cart_inventory").innerHTML += '</div>';
		}
		document.getElementById("cart_cost_summary").innerHTML = '<span class="pull-right">'+totalItems+' item(s), Total = $'+totalCost.toFixed(2)+'</span>';


		var customer = sessionStorage.getItem('customer');

		if(customer) {

			customer = JSON.parse(customer);
			console.log("Customer about to checkout: "+JSON.stringify(customer));
							// Set up PayPal with the checkout.js library
							paypal.Button.render({

								env: '{environment}',
								commit: true,
								payment: function () {

									// Set up a url on your server to create the payment
//									var CREATE_URL = 'https://'+restDomain+'/create-payment';
									var CREATE_URL = '/create-payment';

									// Set up the data you need to pass to your server
									var data = {
										customer: JSON.stringify(customer)
									};

									// Make a call to your server to set up the payment
									return paypal.request.post(CREATE_URL, data).then(function(res) {
										alert("Payment created: "+res.paymentID);
										console.log("Payment created: "+res.paymentID);
										return res.paymentID;
									});
								},
								onAuthorize: function (data, actions) {

									// Set up a url on your server to execute the payment
									var EXECUTE_URL = '/execute-payment';
//									var EXECUTE_URL = 'https://'+restDomain+'/execute-payment';

									console.log("Received authorisation: "+JSON.stringify(data));

									// Set up the data you need to pass to your server
									var data = {

										customer: JSON.stringify(customer),
										paymentID: data.paymentID,
										payerID: data.payerID
									};

									// Make a call to your server to execute the payment
									return paypal.request.post(EXECUTE_URL, data).then(function (res) {

										console.log("Payment complete: "+JSON.stringify(res));
										localStorage.removeItem('cart');
										document.getElementById("cart_cost_summary").innerHTML = '';
										document.getElementById("paypal-button").innerHTML = '';
										document.getElementById("cart_title").innerHTML = 'Order Status...';
										document.getElementById("cart_inventory").innerHTML = 'Success!';
									});
								},
								onCancel: function (data) {

									console.log('Checkout payment cancelled.', JSON.stringify(data, 0, 2));
								},
								onError: function (error) {

									console.log("Error while creating or executing payment: "+JSON.stringify(error));
									if(error) {error = JSON.stringify(error);}
									if(!error || error.length == 0 || error == '{}') {error = 'Payment failure.';}
									console.log("Payment authorisation failed: "+error);
									document.getElementById("cart_cost_summary").innerHTML = '';
									document.getElementById("paypal-button").innerHTML = '';
									document.getElementById("cart_title").innerHTML = 'Order Status...';
									document.getElementById("cart_inventory").innerHTML = error;
								}
							}, '#paypal-button').then(function () {
							// The PayPal button will be rendered in an html element with the id
							// `paypal-button`. This function will be called when the PayPal button
							// is set up and ready to be used.
								return true;
							});
		}
	} else {

		document.getElementById("cart_inventory").innerHTML = '...is currently empty. Please browse our store for some great products!';
	}
	
	$('#cart_clear').on('click', function () {

		var customer = sessionStorage.getItem('customer');
		console.log("Current customer: "+customer);
		if(customer) {

			customer = JSON.parse(customer);
			console.log("Cart is clearing");
			
			$.ajax({
				url: '/cart/'+customer.sub,
				type: 'delete',
				dataType: 'json',
				success: function (uploadedCartItem) {
					
					$('#status').empty().text('Cart update success');
					console.log("Remote cart update success - new item: "+JSON.stringify(uploadedCartItem));
					localStorage.removeItem('cart');
					document.getElementById("cart_inventory").innerHTML = '...is currently empty. Please browse our store for some great products!';
		    		return false;		
				},
				error: function (xhr) {
					
					$('#status').empty().text('Cart update error: '+xhr.status);
					console.log("Cart update error: "+xhr.status);
		    		return false;		
				}
			});
		} else {
			
			localStorage.removeItem('cart');
			document.getElementById("cart_inventory").innerHTML = '...is currently empty. Please browse our store for some great products!';
    		return false;		
		}
	});
});
</script>
