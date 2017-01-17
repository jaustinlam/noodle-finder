$(document).ready(function(){
	$(".button-collapse").sideNav();
	
});

function initMap(){
	function MapViewModel(){
		var self = this;
		
		// Los Angeles Coordinates
		var lat = 34.0522;
		var long = -118.2437;
		// FourSquare Client Details.
		var CLIENT_ID = "YBJDPS3IUH1XOTWRGY0CVLSTUUEPCVLUIXPWGIUOEMD3NNVH";
		var CLIENT_SECRET = "YI1HYR2XN2U0YNLIYETVHCUXYSWA03WIFIVMPXHGIDQ1W5U0";

		// Los Angeles Map
		self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 11,
			center: new google.maps.LatLng(lat, long),
			disableDefaultUI: true,
			// draggable: false,
			// scrollwheel: false
		});

		// Timeout error if something does wrong with data
		var fourSquareTimeout = setTimeout(function(){
			alert("Failed to get restaurant data");
		}, 8000);
		// ajax request for FourSquare API
		$.ajax({
			url: 'https://api.foursquare.com/v2/venues/search?ll=' + lat + "," + long,
			dataType: 'jsonp',
			data: 
				"client_id=" + CLIENT_ID +
					"&client_secret=" + CLIENT_SECRET +
					"&v=" + "20170114" +
					"&query=noodles",
					// TO DO SET TIME AND DATE TO NOW
			success: function(data) {
				console.log("Data received");
				clearTimeout(fourSquareTimeout);

				var restaurants = [];
				self.results = data.response.venues;

				if(localStorage.restaurants){
					localStorage.clear();
				};
				for (var i = self.results.length - 1; i >= 0; i--) {
					var restaurant = {
						name: self.results[i].name
					}
					restaurants.push(restaurant);
					
					


				};
				localStorage.setItem("restaurants", JSON.stringify(restaurant));
				console.log(localStorage.restaurants);
				



				function toggleBounce(){
					if (self.marker.getAnimation() !== null) {
						self.marker.setAnimation(null);
					} else {
						self.marker.setAnimation(google.maps.Animation.BOUNCE);
					}
				};
				
				for (var i = self.results.length - 1; i >= 0; i--) {
					self.contentString = 'This is a test';
					self.infowindow = new google.maps.InfoWindow({
						content: self.contentString
					});
					self.lng = self.results[i].location.lng;
					self.lat = self.results[i].location.lat;
					// Markers
					var icon = 'images/82812-200.png';
					// var selectedIcon 
					self.marker = new google.maps.Marker({
						position: {lat: self.lat, lng: self.lng },
						map: self.map,
						icon: icon,
						animation: google.maps.Animation.DROP
					});
					// self.marker.addListener('click', toggleBounce);
					self.marker.addListener('click', (function(markerCopy){
						return function(){
							self.infowindow.open(self.map, markerCopy);
							if (markerCopy.getAnimation() !== null) {
								markerCopy.setAnimation(null);
							} else {
							markerCopy.setAnimation(google.maps.Animation.BOUNCE);
							};
						};
					})(self.marker));

				};
				console.log(self.results);
				
			},
			error: function(){
				alert("Sorry data failed to load")
			} 
		});


	};
	ko.applyBindings(new MapViewModel());
};

// Create a new AppViewModel
