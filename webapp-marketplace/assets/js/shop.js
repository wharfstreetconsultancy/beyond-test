<div class="body">
	<div class="container-fluid">
		<div id="products_list" class="row text-center">
			<div class="panel panel-primary">
				<div class="panel-heading">
					<div class="row">
						<div class="col-lg-12">Dummy Name</div>
					</div>
				</div>
				<div class="panel-body">
					<div class="row">
						<div class="col-md-12 hero-feature">
							<div class="thumbnail">
								<a href="/product?id="><img src="/img/FullSizeRender_19.jpg" width="150" alt="Dummy Name"></a>
							</div>
							<div>
								<a href="/product?id=" class="btn btn-primary">View</a>
							</div>
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
var products = {products.list};
$(document).ready(function() {

	if(!products) {

		document.getElementById("products_list").innerHTML = 'No products available in store...';
	} else {

		var htmlBuffer = '';
		for(var product of products) {

			htmlBuffer += '<div class="col-lg-3">';
			htmlBuffer += '<div class="panel panel-primary">';
			htmlBuffer += '<div class="panel-heading">';
			htmlBuffer += '<div class="row">';
			htmlBuffer += '<div class="col-lg-12">'+product.name+'</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '<div class="panel-body">';
			htmlBuffer += '<div class="row">';
			htmlBuffer += '<div class="col-md-12 hero-feature">';
			htmlBuffer += '<div>';
			htmlBuffer += '$'+parseFloat(product.price).toFixed(2);
			htmlBuffer += '</div>';
			
			if(product.images) {
	
				for(var image of product.images) {
					if(image.isDefault) {
	
						htmlBuffer += '<div class="thumbnail">';
						htmlBuffer += '<a href="/product?id='+product.id+'"><img src="'+image.location+'" width="150" alt="'+product.name+'"></a>';
						htmlBuffer += '</div>';
					}
				}
			}
			
			htmlBuffer += '<div>';
			htmlBuffer += '<a href="/product?id='+product.id+'" class="btn btn-primary">View</a>';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '<div class="panel-footer">';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
			htmlBuffer += '</div>';
		}
		
		document.getElementById("products_list").innerHTML = htmlBuffer; 
	}

});
</script>
