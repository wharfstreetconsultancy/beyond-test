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
        	<li><a href="/">Shop<span class="sr-only">(current)</span></a></li>
			<li><a href="/about">About Us<span class="sr-only">(current)</span></a></li>
			<li><a href="/contact">Contact</a></li>
			<li><a id="user_nav" class="dropdown-toggle fa fa-user" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
			<div class="dropdown-menu pull-right" aria-labelledby="user_nav"><form id="identity" class="form-inline" method="post"></form></div></li>
			<!-- li><a id="cart_preview_nav" class="dropdown-toggle fa fa-shopping-cart" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> My Cart</a>
			<div class="dropdown-menu pull-right" aria-labelledby="cart_preview_nav"><form id="cart_preview" action="/checkout_confirmation" method="post" class="form-inline"></form></div></li -->
			<li>
			  <form id="cart_manager" action="/cart" method="post"/>
				<a id="cart_checkout" class="fa fa-shopping-cart"> My Cart</a>
			  </form>
			</li>
		  </ul>
		</div>
	  </div>
</nav>
<!-- span id="customer_management"></span -->
<span id="cart_management"></span>
<script>
$(document).ready(function() {
//	$("#customer_management").load("js/customer.js");
	$("#cart_management").load("js/cart.js");
});
</script>
