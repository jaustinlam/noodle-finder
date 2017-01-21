$(document).ready(function(){
	$(".button-collapse").sideNav();
	
});
var pos
function init(){
	function MapViewModel(){
		var self = this;
		
		lat = ko.observable(34.0522);
		lng = ko.observable(-118.2437);
		restaurants = ko.observableArray([]);
		id = ko.observable();
		name = ko.observable();
		website = ko.observable();
		zipcode = ko.observable();


		// Google Map
		self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 11,
			center: new google.maps.LatLng(lat(), lng()),
			disableDefaultUI: true,
		});

		// Update the map with Geolocation if available 
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position){
				lat(position.coords.latitude);
				lng(position.coords.longitude);
				pos = {
					lat: lat(),
					lng: lng(),
				};
			self.map.setCenter(pos);
			self.map.setZoom(13);
			});
		};

		// This function updates the map center when the user enters a new zipcode
		this.onMapUpdate = function(){
			var geocodeTimeout = setTimeout(function(){
			alert("Sorry something went wrong with updating the Map. Please refresh and try again");
			}, 8000);
			$.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDxLsPdWpj7FzoQL_N0HswX-x_3yL9_7Co",
				dataType: "json", // Need to figure out jsonp
				data:
					"&new_forward_geocoder=true" +
					"&address=" + zipcode(),
				success: function(data) {
					console.log("Geocode received")
					clearTimeout(geocodeTimeout);
					// console.log(data);
					lat(data.results[0].geometry.location.lat);
					lng(data.results[0].geometry.location.lng);
					var zippy = (data.results[0].geometry.location.lat);
				},
				error: function(){
					alert("Sorry something went wrong with updating the Map. Please refresh and try again");
				},

			});
			pos = {
				lat: lat(),
				lng: lng(),
			};
			self.map.setCenter(pos);
			self.map.setZoom(13);
		};

		
		// FourSquare Client Details.
		var CLIENT_ID = "YBJDPS3IUH1XOTWRGY0CVLSTUUEPCVLUIXPWGIUOEMD3NNVH";
		var CLIENT_SECRET = "YI1HYR2XN2U0YNLIYETVHCUXYSWA03WIFIVMPXHGIDQ1W5U0";

		

		// Timeout error if something does wrong with data
		var fourSquareTimeout = setTimeout(function(){
			alert("Failed to get restaurant data");
		}, 8000);

		// AJAX request for FourSquare API
		$.ajax({
			url: 'https://api.foursquare.com/v2/venues/search?ll=' + lat() + "," + lng(),
			dataType: 'jsonp',
			data: 
				"client_id=" + CLIENT_ID +
					"&client_secret=" + CLIENT_SECRET +
					"&v=" + "20170114" +
					"&query=noodles",
					// TO DO SET TIME AND DATE TO NOW
			success: function(data) {
				// Success message
				console.log("Data received");
				// Clear the Timeout Error
				clearTimeout(fourSquareTimeout);

				// Empty array to store restaurants
				var restaurants = [];
				// Set returns to self.results
				self.results = data.response.venues;

				// Clear local store if data exists
				if(localStorage.restaurants){
					localStorage.clear();
				};
				for (var i = self.results.length - 1; i >= 0; i--) {
					var currentRestaurant = self.results[i];
					var restaurant = {
						id: currentRestaurant.id,
						name: currentRestaurant.name,
						website: currentRestaurant.url,
						lat: currentRestaurant.location.lat,
						lng: currentRestaurant.location.lng,
						visible: true,
					};
					// Push restaurant object to restaurants array
					restaurants.push(restaurant);
				};
				// Save restaurants array to local storage
				localStorage.setItem("restaurants", JSON.stringify(restaurants));
				// console.log(localStorage.restaurants);
			
			},
			// Error if fails
			error: function(){
				alert("Sorry data failed to load")
			} 
		});
		// Array of restaurants
		this.mapRestaurants = ko.observableArray(JSON.parse(localStorage.restaurants));

		// Placing Markers on Mapa
		var markerArray = [];
		for (var i = self.mapRestaurants().length - 1; i >= 0; i--) {
			self.contentString = '<h6>' + self.mapRestaurants()[i].name + '</h6>';
			self.lng = self.mapRestaurants()[i].lng;
			self.lat = self.mapRestaurants()[i].lat;
			// Markers
			var icon = 'images/icon.png';
			// var selectedIcon 
			self.marker = new google.maps.Marker({
				position: {lat: self.lat, lng: self.lng },
				map: self.map,
				icon: icon,
				animation: google.maps.Animation.DROP,
				id: self.mapRestaurants()[i].id
			});
			self.marker.info = new google.maps.InfoWindow({
				content: self.mapRestaurants()[i].name
			})
			markerArray.push(self.marker);

			// self.marker.addListener('click', toggleBounce);
			self.marker.addListener('click', (function(markerCopy){
				return function(){
					markerCopy.info.open(self.map, markerCopy);
					if (markerCopy.getAnimation() !== null) {
						markerCopy.setAnimation(null);
					} else {
					markerCopy.setAnimation(google.maps.Animation.BOUNCE);
					};
				};
			})(self.marker));
		};

		this.clickOpen = function(data, event){
			console.log(data);
			console.log("you clicked" + event.target.id);
			console.log(markerArray[0].id);

		}
	};

	

	ko.applyBindings(new MapViewModel());
};

// Create a new AppViewModel
