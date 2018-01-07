<nav class="navbar navbar-default navbar-fixed-top">
	<div class="container-fluid">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed pull-right" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
			<a style="padding: 0px 10px" class="navbar-brand" href="/"><img style="max-height: 50px; margin: auto" src="img/SVGlogo.png" alt="Suroor Fashions - Marketplace"/></a>
		</div>
		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
			<ul class="nav navbar-nav navbar-right">
		    	<li class="active">
		  			<a id="showcase_link"  href="#" class="fa fa-star"> Featured</a>
		  		</li>
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
	    </div>
	</div>
</nav>
<script>
$(document).ready(function() {

	var sessionStatus = function (event_source, $container) {
alert(1);
		$(event_source).bind('session_status', function (event, signedIn) {
			alert(JSON.stringify($container)+":"+JSON.stringify(event)+":"+signedIn);
			$container.innerHTML = (signedIn) ? ' Sign-Out' : 'Sign-In';
			alert(3);
		});
		alert(4);
	};
	alert(5);
	new sessionStatus(document, $('cust_link'));
	alert(6);
	$(document).trigger('session_status', true);
	alert(7);

	$('#showcase_link').on('click', function () {

		$("#body_main").load("js/showcase.js");
		return false;
	});

	$('#showcase_link').on('click', function () {

		$("#body_main").load("js/showcase.js");
		return false;
	});

	$('#shop_link').on('click', function () {

		$("#body_main").load("js/shop.js");
		return false;
	});

	$('#cart_link').on('click', function () {

		$("#body_main").load("js/cart.js");
		return false;
	});
/*
	$('#cart_link').on('click', function () {

		var localCart = localStorage.getItem('cart');
		if(localCart) {

			document.getElementById("cart_manager").innerHTML = '<input type=\'hidden\' name=\'cart\' value=\''+localCart+'\'/>';
		}
		$('#cart_manager').submit();
 		return false;
	});
*/

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

			$("#body_main").load("js/signin.js");
		}
 		return false;
	});

/*
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
*/
});
</script>
