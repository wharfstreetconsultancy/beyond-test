<div class="body">
	<div class="container-fluid">
		<div class="col-lg-6 col-lg-offset-3">
			<div class="panel panel-primary">
				<div class="panel-heading">
					<div class="row">
						<div id="title" class="col-lg-12">Please Sign-up...</div>
					</div>
				</div>
				<div class="panel-body">
					<div class="row">
						<div class="col-lg-12">
							<form id="signup_form" class="form-inline" method="post">
								<p><span id="cust_msg">Please provide your customer credentials and check your inbox to confirm your email...</span></p>
								<input id="email" name="email" type="text" placeholder="Email..."/><br>
								<input id="password" name="password" type="password" placeholder="Password..."/><br>
								<input id="password_confirm" name="password_confirm" type="password" placeholder="Confirm password..."/>
								<hr>
								<input id="given_name" name="given_name" type="text" placeholder="First name..."/><br>
								<input id="family_name" name="family_name" type="text" placeholder="Last name..."/><br>
								<hr>
								+1(<input id="tel1" name="tel[part1]" type="text" min="3" max="3" size="3" placeholder="012"/>)-<input id="tel2" name="tel[part2]" type="text" min="3" max="3" size="3" placeholder="345"/>-<input id="tel3" name="tel[part3]" type="text" min="4" max="4" size="4" placeholder="6789"/><br>
								<hr>
								<input id="address1" name="address[line1]" type="text" placeholder="Address line 1..."/><br>
								<input id="address2" name="address[line2]" type="text" placeholder="Address line 2..."/><br>
								<input id="city" name="address[city]" type="text" placeholder="City..."/><br>
								<input id="state" name="address[state]" type="text" min="2" max="2" size="2" placeholder="--"/><input id="zip" name="address[zip]" type="text" min="5" max="5" size="5" placeholder="Zip..."/><br>
							</form>
						</div>
					</div>
					<hr>
					<div class="row">
						<div class="col-lg-12">
							<button id="signup_btn" type="submit" value="signup" form="signup_form" class="btn btn-primary btn-block">Sign-up</button>
						</div>
					</div>
				</div>
				<div class="panel-footer">
				</div>
			</div>
		</div>
	</div>
</div>
<script>
$(document).ready(function() {

	$('#signup_btn').on('click', function () {

		$('#signup_form').ajaxSubmit({

			url: '/customer',
			type: 'post',
			dataType: 'json',
			success: function (response, status, xhr) {
		
				$('#status').empty().text('Sign-up success');
				console.log("Sign-up success: "+JSON.stringify(response));

				document.location.href='/signin';
			},
			error: function (xhr) {

				console.log("Failed to sign-up: "+xhr.responseJSON.error.code);
				console.log("Error message returned: "+xhr.responseJSON.error.message);
				var errorMessage = xhr.responseJSON.error.message+' Please retry...';
				document.getElementById("cust_msg").innerHTML = errorMessage;
			}
		});
		return false;
	});
});
</script>
