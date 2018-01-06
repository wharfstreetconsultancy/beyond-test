<div class="body">
	<div class="container-fluid">
		<div class="col-lg-4">
			<div class="panel panel-primary">
				<div class="panel-heading">
					<div class="row">
						<div id="title" class="col-lg-12">Please Sign-in...</div>
					</div>
				</div>
				<div class="panel-body">
					<div class="row">
						<div class="col-lg-12">
							<form id="signin_form" class="form-inline">
								<p>
									<span id="cust_msg">
										Please provide your customer credentials if you have already registered.
									</span>
								</p>
								<input id="email" name="email" type="text" placeholder="Email..." /><br> <input id="password" name="password" type="password" placeholder="Password..." />
							</form>
						</div>
					</div>
					<hr>
					<div class="row">
						<div class="col-lg-12">
							<button id="signin_btn" type="submit" value="signin" form="signin_form" class="btn btn-primary btn-block">Sign-in</button>
							<br>
							Not regeistered?
							<br>
							<a id="signup" href="#">Sign-up here</a> to do so.
						</div>
					</div>
				</div>
				<div class="panel-footer"></div>
			</div>
		</div>
	</div>
</div>
<script>

$(document).ready(function() {

	$('#signin_btn').on('click', function () {

		$('#signin_form').ajaxSubmit({
			
			url: '/customer/session',
			type: 'post',
			dataType: 'json',
			success: function (customer, status, xhr) {
		
				$('#status').empty().text('Sign-in success');
				sessionStorage.setItem('customer', JSON.stringify(customer));
				console.log("Sign-in success: "+JSON.stringify(customer));

				if({check.cart}) {
					
					document.getElementById("cart_link").click();
				} else {
					
					document.location.href='/';
				}
			},
			error: function (xhr) {

				console.log("Failed to sign-in: "+xhr.responseJSON.error.code);
				console.log("Error message returned: "+xhr.responseJSON.error.message);
				var errorMessage = 'Failed to sign-in. Please retry...';
				if(xhr.responseJSON.error.code == 'NotAuthorizedException') {

					errorMessage = xhr.responseJSON.error.message+' Please retry...';
				} else if(xhr.responseJSON.error.code == 'UserNotFoundException') {

					errorMessage = 'Username/password combination not found. Please retry...';
				} else if(xhr.responseJSON.error.code == 'UserNotConfirmedException') {

					errorMessage = xhr.responseJSON.error.message+' Please check your mail...';
				}
				document.getElementById("cust_msg").innerHTML = errorMessage;
			}
		});
		return false;
	});
});
</script>
