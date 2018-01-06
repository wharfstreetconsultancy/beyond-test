<nav class="navbar navbar-default navbar-fixed-top">
	<div class="container-fluid">
	  <!-- Brand and toggle get grouped for better mobile display -->
	  <div class="navbar-header">
	    <button type="button" class="navbar-toggle collapsed pull-right" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
	      <span class="sr-only">Toggle navigation</span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	    </button>
	    <!-- a style="padding: 0px" class="navbar-brand" href="/"><img style="max-height: 50px; padding-left: 10px" src="img/SVGlogo.png" alt="Suroor Fashions - Marketplace"/></a -->
	    <a style="padding: 0px 10px" class="navbar-brand" href="/"><img style="max-height: 50px; margin: auto" src="img/SVGlogo.png" alt="Suroor Fashions - Marketplace"/></a>
	  </div>
	
	  <!-- Collect the nav links, forms, and other content for toggling -->
	  <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
	    <ul class="nav navbar-nav navbar-right">
	    	<li class="active"><a href="/" class="fa fa-star"> Featured</a></li>
			<li>
				<a id="shop_link" href="#" class="fa fa-tags"> Shop</a>
			</li>
			<li>
				<a href="/about" class="fa fa-book"> About Us</a>
			</li>
			<li>
				<a href="/contact" class="fa fa-phone"> Contact</a>
			</li>
			<li>
				<a id="cart_link" href="#" class="fa fa-shopping-cart"> My Cart</a>
				<form id="cart_manager" action="/cart" method="post"/>
			</li>
			<li>
				<a id="cust_link" href="#" class="dropdown-toggle fa fa-user"/>
			</li>
	    </ul>
	  </div><!-- /.navbar-collapse -->
	</div><!-- /.container-fluid -->
</nav>
<script>
$(document).ready(function() {
	var customer = sessionStorage.getItem('customer');
	if(customer) {

		document.getElementById("cust_link").innerHTML = ' Sign-out';
	} else {

		document.getElementById("cust_link").innerHTML = ' Sign-In';
	}

	$('#shop_link').on('click', function () {

		$("#body_main").load("js/shop.js");
		return false;
	});
	
	$('#cust_link').on('click', function () {
		
		var customer = sessionStorage.getItem('customer');
		if(customer) {

			$.ajax({
				url: '/customer/session',
				type: 'delete',
				dataType: 'json',
				crossDomain: true,
				success: function (response) {

					sessionStorage.removeItem('customer');
					console.log("Sign-out success: "+response);
					document.getElementById("cust_link").innerHTML = ' Sign-In';
				},
				error: function (xhr) {

					console.log("Failed to sign-out: "+JSON.stringify(xhr));
				}
			});
		} else {

			document.location.href = '/signin';
		}
 		return false;
	});
	
	$('#cart_link').on('click', function () {

		var localCart = localStorage.getItem('cart');
		if(localCart) {

			document.getElementById("cart_manager").innerHTML = '<input type=\'hidden\' name=\'cart\' value=\''+localCart+'\'/>';
		}
		$('#cart_manager').submit();
 		return false;
	});

	$('#identity').on('click', '#signout_btn', function () {

		$.ajax({
			url: '/customer/session',
			type: 'delete',
			dataType: 'json',
			crossDomain: true,
			success: function (response) {

				$('#status').empty().text('Sign-out success.');
				sessionStorage.removeItem('customer');
				console.log("Sign-out success: "+response);
				reloadCustomerProfile(function () {
					
					console.log("Customer profile unloaded.");
					document.getElementById("signin").checked = true;
					document.getElementById("user_nav").click();
				});
			},
			error: function (xhr) {

				$('#status').empty().text('Failed to sign-out: '+xhr.status);
				console.log("Failed to sign-out: "+JSON.stringify(xhr));
			}
		});
		return false;
	});
});
</script>
