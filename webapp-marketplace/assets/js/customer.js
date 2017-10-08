<!-- a id="user_nav" class="dropdown-toggle fa fa-user" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
<div class="dropdown-menu pull-right" aria-labelledby="user_nav"><form id="identity" class="form-inline" method="post"></form></div -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.51/jquery.form.min.js"></script>
<script>
function reloadCustomerProfile(callback) {

	var customer = sessionStorage.getItem('customer');
	console.log("Current customer: "+customer);
	if(!customer) {

		var signupElement = document.getElementById("signup");
		var signup = (signupElement && signupElement.checked == true);
		document.getElementById("identity").innerHTML = '';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += '<input id="signup" name="signup_signin_choice" type="radio" value="signup"'+((signup) ? ' checked' : '')+'>Sign-up</input>';
		document.getElementById("identity").innerHTML += '<input id="signin" name="signup_signin_choice" type="radio" value="signin"'+((signup) ? '' : ' checked')+'>Sign-in</input>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '<hr>';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += '<p><span id="user_msg">'+((signup) ? 'Please provide account details...' :'Please provide your credentials...')+'</span></p>';
		document.getElementById("identity").innerHTML += '<input id="email" name="email" type="text" placeholder="Email..."/><br>';
		document.getElementById("identity").innerHTML += '<input id="password" name="password" type="password" placeholder="Password..."/><br>';
		if(signup) {
			document.getElementById("identity").innerHTML += '<input id="password_confirm" name="password_confirm" type="password" placeholder="Confirm password..."/>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '<hr>';
			document.getElementById("identity").innerHTML += '<div class="row">';
			document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
			document.getElementById("identity").innerHTML += '<input id="given_name" name="given_name" type="text" placeholder="First name..."/><br>';
			document.getElementById("identity").innerHTML += '<input id="family_name" name="family_name" type="text" placeholder="Family name..."/><br>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '<hr>';
			document.getElementById("identity").innerHTML += '<div class="row">';
			document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
			document.getElementById("identity").innerHTML += '<input id="phone_number" name="phone_number" type="text" placeholder="Phone number..."/><br>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '</div>';
			document.getElementById("identity").innerHTML += '<hr>';
			document.getElementById("identity").innerHTML += '<div class="row">';
			document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
			document.getElementById("identity").innerHTML += '<input id="address1" name="address[line1]" type="text" placeholder="Address line 1..."/><br>';
			document.getElementById("identity").innerHTML += '<input id="address2" name="address[line2]" type="text" placeholder="Address line 2..."/><br>';
			document.getElementById("identity").innerHTML += '<input id="city" name="address[city]" type="text" placeholder="City..."/><br>';
			document.getElementById("identity").innerHTML += '<input id="state" name="address[state]" type="text" placeholder="State..."/><input id="zip" name="address[zip]" type="text" placeholder="Zip..."/><br>';
		}
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '<hr>';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += '<button id="'+((signup) ? 'signup' : 'signin')+'_btn" type="submit" value="'+((signup) ? 'signup' : 'signin')+'" class="btn btn-primary btn-block">'+((signup) ? 'Sign-up' : 'Sign-in')+'</button>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("user_nav").innerHTML = ' Sign-Up/In';
	} else {

		customer = JSON.parse(customer);
		document.getElementById("identity").innerHTML = '';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += customer.given_name+' '+customer.family_name;
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '<hr>';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += 'My Details<br>';
		document.getElementById("identity").innerHTML += 'My Orders<br>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '<hr>';
		document.getElementById("identity").innerHTML += '<div class="row">';
		document.getElementById("identity").innerHTML += '<div class="col-lg-10 col-lg-offset-1">';
		document.getElementById("identity").innerHTML += '<button id="signout_btn" type="submit" value="signout" class="btn btn-primary btn-block">Sign-out</button>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("identity").innerHTML += '</div>';
		document.getElementById("user_nav").innerHTML = ' My Account';
	}
	callback();
}

$(document).ready(function() {
	reloadCustomerProfile(function () {
		
		console.log("Customer profile loaded.");
	});
	$('#identity').on('click', 'input[name=signup_signin_choice]', function () {
		reloadCustomerProfile(function () {
			console.log("User loading done.");
			document.getElementById("user_nav").click();
		});
		return true;
	});
	$('#identity').on('click', '#signup_btn', function () {

		$('#identity').ajaxSubmit({

			url: '/customer',
			type: 'post',
			dataType: 'json',
			success: function (response) {
		
				$('#status').empty().text('Sign-up success');
				console.log("Sign-up success: "+JSON.stringify(response));
				document.getElementById("signin").checked = true;
				reloadCustomerProfile(function () {
					
					console.log("User profile loaded: "+JSON.stringify(response));
					document.getElementById("user_nav").click();
				});
			},
			error: function (xhr) {

				console.log("Failed to sign-up: "+xhr.responseJSON.error.code);
				console.log("Error message returned: "+xhr.responseJSON.error.message);
				var errorMessage = 'Failed to sign-up. Please retry...';
				if(xhr.responseJSON.error.code == 'InvalidParameterException') {
					errorMessage = xhr.responseJSON.error.message+' Please retry...';
				}
				document.getElementById("user_msg").innerHTML = errorMessage;
			}
		});
		return false;
	});
	$('#identity').on('click', '#signin_btn', function () {

		$('#identity').ajaxSubmit({
			
			url: '/customer/session',
			type: 'post',
			dataType: 'json',
			success: function (customer) {
		
				$('#status').empty().text('Sign-in success');
				sessionStorage.setItem('customer', JSON.stringify(customer));
				console.log("Sign-in success: "+JSON.stringify(customer));
				reloadCustomerProfile(function () {
					
					console.log("Customer profile loaded: "+customer.sub);
					document.getElementById("user_nav").click();
				});
			},
			error: function (xhr) {

				console.log("Failed to sign-in: "+xhr.responseJSON.error.code);
				console.log("Error message returned: "+xhr.responseJSON.error.message);
				var errorMessage = 'Failed to sign-in. Please retry...';
				if(xhr.responseJSON.error.code == 'NotAuthorizedException') {
					errorMessage = xhr.responseJSON.error.message+' Please retry...';
				} else if(xhr.responseJSON.error.code == 'UserNotConfirmedException') {
					errorMessage = xhr.responseJSON.error.message+' Please check your mail...';
				}
				document.getElementById("user_msg").innerHTML = errorMessage;
			}
		});
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
