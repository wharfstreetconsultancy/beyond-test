<style>
footer {
    position: fixed;
}
</style>
<div class="container-fluid">
	<div class="row">
		<div class="col-sm-1 header">
			<div class="col-xs-1 col-md-1 col-lg-1 text-center">
				<a href="/"><img src="img/SVGlogo.svg" class="img" alt="Suroor Fashions - Marketplace"></a>
			</div>
		</div>
	</div>
</div>
<nav class="navbar navbar-default">
	<div class="container-fluid nav-con">
		<!--Brand and toggle get grouped for better mobile display-->
		<div class="navbar-header">
			<div class="col-sm-1 header">
				<button type="button" class="navbar-toggle x collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
					<span class="sr-only">Toggle navigation</span>
					<span class="icon-bar"></span>
					<span class="icon-bar second-bar"></span>
				</button>
			</div>
		</div>
		<!--Collect the nav links, forms, and other content for toggling-->
		<div class="collapse navbar-collapse cool-nav" id="bs-example-navbar-collapse-1">
			<ul class="myNav nav navbar-nav">
				<li><a href="/shop">Shop<span class="sr-only">(current)</span></a></li>
				<li><a href="/about">About Us<span class="sr-only">(current)</span></a></li>
				<li><a href="/contact">Contact</a></li>
				<!-- li><a id="user_nav" class="dropdown-toggle fa fa-user" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
				<div class="dropdown-menu pull-right" aria-labelledby="user_nav"><form id="identity" class="form-inline" method="post"></form></div></li -->
				<!-- li><a id="cart_preview_nav" class="dropdown-toggle fa fa-shopping-cart" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> My Cart</a>
				<div class="dropdown-menu pull-right" aria-labelledby="cart_preview_nav"><form id="cart_preview" action="/checkout_confirmation" method="post" class="form-inline"></form></div></li -->
				<li>
					<a id="cart_link" class="fa fa-shopping-cart" href="#"> My Cart</a>
					<form id="cart_manager" action="/cart" method="post"/>
				</li>
				<li>
					<a id="cust_link" class="dropdown-toggle fa fa-user" href="#"/>
				</li>
			</ul>
		</div>
	</div>
</nav>
<script>
$(document).ready(function() {
	var customer = sessionStorage.getItem('customer');
	if(customer) {

		document.getElementById("cust_link").innerHTML = ' Sign-out';
	} else {

		document.getElementById("cust_link").innerHTML = ' Sign-In';
	}

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

			document.getElementById("cart_manager").innerHTML = '<input type=\'hidden\' name=\'cart\' value=\''+localCart+'\'/>'
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
