<a id="cart_preview_nav" class="dropdown-toggle fa fa-shopping-cart" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> My Cart</a>
<div class="dropdown-menu pull-right" aria-labelledby="cart_preview_nav"><form id="cart_preview" class="form-inline"></form></div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.51/jquery.form.min.js"></script>
<!-- script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script -->
<script>
function reloadCustomerCart() {

	var localCart = JSON.parse(localStorage.getItem('cart'));
	console.log("Current cart: "+JSON.stringify(localCart));
	var totalItems = 0;
	var totalCost = 0.00;
	if(localCart && localCart.items) {
		for(var cartItem of localCart.items) {
			
			totalItems += cartItem.quantity;
			totalCost += cartItem.cost;
		}
	}
	document.getElementById("cart_preview").innerHTML = '';
	document.getElementById("cart_preview").innerHTML += '<div class="row">';
	document.getElementById("cart_preview").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
	document.getElementById("cart_preview").innerHTML += totalItems+' item(s) @ ($'+totalCost.toFixed(2)+')';
	document.getElementById("cart_preview").innerHTML += '</div>';
	document.getElementById("cart_preview").innerHTML += '</div>';
	document.getElementById("cart_preview").innerHTML += '<hr>';
	if(localCart && localCart.items) {
		for(var cartItem of localCart.items) {
			
			document.getElementById("cart_preview").innerHTML += cartItem.quantity+' x <a href="/product?id='+cartItem.productId+'">'+cartItem.productName+'</a> - ('+cartItem.color+'/'+cartItem.size+') - ($'+cartItem.cost.toFixed(2)+')<br>';
			console.log("Current cart item: "+JSON.stringify(cartItem));
		}
		if(localCart.items.length > 0) {
			document.getElementById("cart_preview").innerHTML += '<hr>';
			document.getElementById("cart_preview").innerHTML += '<div class="row">';
			document.getElementById("cart_preview").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
			document.getElementById("cart_preview").innerHTML += '<a id="checkout" href="cart.html" class="btn btn-primary pull-left">Checkout</a>';
			document.getElementById("cart_preview").innerHTML += '<button type="reset" id="clear" name="clear" form="cart_preview" class="btn btn-primary pull-right">Clear</button>';
			document.getElementById("cart_preview").innerHTML += '</div>';
			document.getElementById("cart_preview").innerHTML += '</div>';
		}
	}
}

$(document).ready(function() {

	reloadCustomerCart(function () {
		
		console.log("Customer cart loaded.");
	});

	$('#cart_preview').on('reset', function () {

		localStorage.removeItem('cart');
		reloadCustomerCart();
		document.getElementById("cart_preview_nav").click();
		return false;		
	});

	$('#cart_control').submit(function () {

		if(true) {
			// No customer found - update local cart only
			var localCart = JSON.parse(localStorage.getItem('cart'));
			var timestamp = new Date().getTime().toString();
			if(!localCart || !localCart.items || localCart.items.length == 0) {
				localCart = {id: timestamp.split("").reverse().join(""), items: []};
			}
		    var newCartItem = {
				id: timestamp.split("").reverse().join(""),
				productId: document.getElementById('productId').value,
				productName: document.getElementById('productName').value, 
				quantity: parseInt(document.getElementById('productQuantity').value),
				color: (document.getElementById('productColor')) ? document.getElementById('productColor').value : null,
				size: (document.getElementById('productSize')) ? document.getElementById('productSize').value : null,
				cost: parseFloat(document.getElementById('productPrice').value) * parseInt(document.getElementById('productQuantity').value),
				created: timestamp,
				lastUpdated: timestamp
		    }
	    	console.log("New cart item:\t\t"+JSON.stringify(newCartItem));
		    var existingCartItem = localCart.items.filter(function (currentCartItem) {
		    	
		    	console.log("Current:\t"+JSON.stringify(currentCartItem));
		    	console.log("New:\t\t"+JSON.stringify(newCartItem));
		    	var sameItem = (
		    		(currentCartItem.productId === newCartItem.productId) &&
		    		(currentCartItem.color === newCartItem.color) &&
		    		(currentCartItem.size === newCartItem.size)
		    	);
		    	console.log(sameItem);
		    	return sameItem;
		    });
	    	console.log("Existing cart item:\t"+JSON.stringify(existingCartItem));
		    if(existingCartItem.length > 0) {

		    	existingCartItem[0].quantity += newCartItem.quantity;
		    	existingCartItem[0].cost += newCartItem.cost;
		    } else {
		    	
		    	localCart.items.push(newCartItem);
		    }
			localStorage.setItem('cart', JSON.stringify(localCart));
			console.log("Local cart update success - full cart: "+JSON.stringify(localCart));
		} else {

			var cartId = 0;
			if(document.cookie.length > 0) {
				var cookieParts = document.cookie.split('=');
				cartId = cookieParts[1];
			}
			this.action = 'https://'+restDomain+'/cart/'+cartId+'/item';
			$('#status').empty().text('Cart is updating...');
			console.log("Cart is updating - call "+this.action);
			
			$(this).ajaxSubmit({
				error: function (xhr) {
					$('#status').empty().text('Cart update error: '+xhr.status);
					console.log("Cart update error: "+xhr.status);
				},
				success: function (newCartItem) {
					$('#status').empty().text('Cart update success');
					console.log("Remote cart update success - new item: "+JSON.stringify(newCartItem));
					// cartItems.push(newCartItem);
				}
			});
		}
		reloadCustomerCart();
		document.getElementById("cart_preview_nav").click();
		return false;		
	});
});

</script>
