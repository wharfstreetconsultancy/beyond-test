<style>
body { padding-top: 70px; }
</style>
<nav class="navbar navbar-default">
	<div class="container-fluid">
	  <!-- Brand and toggle get grouped for better mobile display -->
	  <div class="navbar-header">
	    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
	      <span class="sr-only">Toggle navigation</span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	      <span class="icon-bar"></span>
	    </button>
	    <a class="navbar-brand" href="#">Brand</a>
	  </div>
	
	  <!-- Collect the nav links, forms, and other content for toggling -->
	  <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
	    <ul class="nav navbar-nav">
	      <li class="active"><a href="#">Link <span class="sr-only">(current)</span></a></li>
	      <li><a href="#">Link</a></li>
	      <li class="dropdown">
	        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Dropdown <span class="caret"></span></a>
	        <ul class="dropdown-menu">
	          <li><a href="#">Action</a></li>
	          <li><a href="#">Another action</a></li>
	          <li><a href="#">Something else here</a></li>
	          <li role="separator" class="divider"></li>
	          <li><a href="#">Separated link</a></li>
	          <li role="separator" class="divider"></li>
	          <li><a href="#">One more separated link</a></li>
	        </ul>
	      </li>
	    </ul>
	    <form class="navbar-form navbar-left">
	      <div class="form-group">
	        <input type="text" class="form-control" placeholder="Search">
	      </div>
	      <button type="submit" class="btn btn-default">Submit</button>
	    </form>
	    <ul class="nav navbar-nav navbar-right">
	      <li><a href="#">Link</a></li>
	      <li class="dropdown">
	        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Dropdown <span class="caret"></span></a>
	        <ul class="dropdown-menu">
	          <li><a href="#">Action</a></li>
	          <li><a href="#">Another action</a></li>
	          <li><a href="#">Something else here</a></li>
	          <li role="separator" class="divider"></li>
	          <li><a href="#">Separated link</a></li>
	        </ul>
	      </li>
	    </ul>
	  </div><!-- /.navbar-collapse -->
	</div><!-- /.container-fluid -->
</nav>
<!-- nav class="navbar navbar-default navbar-fixed-top">
	<div class="container-fluid">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
			<a class="navbar-brand" href="/"><img src="img/SVGlogo.svg" id="suroor_banner" height="70" class="img" alt="Suroor Fashions - Marketplace"/></a>
		</div>
		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
			<ul class="nav navbar-nav">
				<li><a href="/shop">Shop</a></li>
				<li><a href="/about">About Us</a></li>
				<li><a href="/contact">Contact</a></li>
				<li>
					<a id="cart_link" class="fa fa-shopping-cart" href="#"> My Cart</a>
					<form id="cart_manager" action="/cart" method="post"/>
				</li>
				<li><a id="cust_link" class="dropdown-toggle fa fa-user" href="#"/></li>
			</ul>
		</div>
	</div>
</nav -->
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
