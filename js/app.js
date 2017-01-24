$(document).ready(function(){
	$(".button-collapse").sideNav();
	
});
var pos;

function init(){
	function MapViewModel(){
		var self = this;
		
		lat = ko.observable(34.0522);
		lng = ko.observable(-118.2437);
		this.mapRestaurants = ko.observableArray([]);
		this.markerArray = ko.observableArray([]);
		this.zipcode = ko.observable();
		this.searchValue = ko.observable();

		// Google Map
		self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 13,
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
			self.map.setZoom(11);
			self.createRestaurants();
			});
		};

		self.setDate = function(){
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1;

			var yyyy = today.getFullYear();
			if(dd<10){
			    dd='0'+dd;
			};
			if(mm<10){
			    mm='0'+mm;
			}; 
			var today = yyyy+mm+dd;
			return today
		};

		
		self.createRestaurants = function(){
			// FourSquare Client Details.
			var CLIENT_ID = 'YBJDPS3IUH1XOTWRGY0CVLSTUUEPCVLUIXPWGIUOEMD3NNVH';
			var CLIENT_SECRET = 'YI1HYR2XN2U0YNLIYETVHCUXYSWA03WIFIVMPXHGIDQ1W5U0';
			var categoryID = '4bf58dd8d48988d14a941735'; 
			var today = self.setDate();
			console.log(today);
			var fourSquareTimeout = setTimeout(function(){
			alert('Failed to get restaurant from FourSquare, please refresh and try again');
			}, 8000);

			$.ajax({
			url: "https://api.foursquare.com/v2/venues/search?ll=" + lat() + "," + lng(),
			dataType: 'jsonp',
			data: 
				"client_id=" + CLIENT_ID +
				"&client_secret=" + CLIENT_SECRET +
				"&intent=browse" +
				"&radius=80000" +
				"&categoryId=" + categoryID +
				"&v=" + today,
				
				// TO DO SET TIME AND DATE TO NOW
				success: function(data) {
					// Success message
					console.log('Four Square Data Received');
					// Clear the Timeout Error
					clearTimeout(fourSquareTimeout);
					// Set returns to results
					var results = data.response.venues;
					self.mapRestaurants.removeAll();
					for (var i = results.length - 1; i >= 0; i--) {
						var currentRestaurant = results[i];
						var restaurant = {
							id: currentRestaurant.id,
							name: currentRestaurant.name,
							address: currentRestaurant.location.formattedAddress[0],
							phone: currentRestaurant.contact.formattedPhone,
							website: currentRestaurant.url,
							lat: currentRestaurant.location.lat,
							lng: currentRestaurant.location.lng,
							visible: ko.observable(true),
						};
						// Push restaurant object to restaurants array
						self.mapRestaurants.push(restaurant);
					};
					self.createMarkers();
				
				},
				// Error if fails
				error: function(){
					alert('Sorry data failed to load')
				} 
			});

		};

		self.createMarkers = function(){
			function clearMarkers() {
				for (var i = 0; i < self.markerArray().length; i++){
					self.markerArray()[i].setMap(null);
				}
				markerArray.length = 0;
			};
			// Placing Markers on Map
			for (var i = self.mapRestaurants().length - 1; i >= 0; i--) {
				var currentRestaurant = self.mapRestaurants()[i];
				self.contentString = '<h6>' + currentRestaurant.name + '</h6>';
				self.lng = currentRestaurant.lng;
				self.lat = currentRestaurant.lat;
				// Markers
				var icon = 'images/icon.png'; 
				self.marker = new google.maps.Marker({
					position: {lat: self.lat, lng: self.lng},
					map: self.map,
					icon: icon,
					animation: google.maps.Animation.DROP,
					id: currentRestaurant.id,
					visiblem: ko.observable(true)
				});
				var markerContent = '<h4>' +
					currentRestaurant.name +
					'</h4><br>' +
					'<p>' + currentRestaurant.address +
					'<br>' +
					'<p>' + currentRestaurant.phone +
					'<br>' +
					'<a href="' + currentRestaurant.website +
					'">View Menu</a></p><br><br>' +
					'<p>Information from FourSquare</p>'



				self.marker.info = new google.maps.InfoWindow({
					content: markerContent
				});
				self.markerArray.push(self.marker);

				self.marker.addListener('mouseover', (function(markerCopy){
					return function(){
						// markerCopy.info.open(self.map, markerCopy);
						// change icon
						markerCopy.setAnimation(google.maps.Animation.BOUNCE);
						
					};
				})(self.marker));
				self.marker.addListener('mouseout', (function(markerCopy){
					return function(){
						markerCopy.info.close();
						markerCopy.setAnimation(null);
					};
				})(self.marker));
			};
		};

		// This function updates the map center when the user enters a new zipcode
		self.onMapUpdate = function(data){
			console.log(self.zipcode());
			console.log(lat());
			var geocodeTimeout = setTimeout(function(){
			alert('Sorry something went wrong with updating the Map. Please refresh and try again');
			}, 8000);
			$.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/" +
					"json?key=AIzaSyDxLsPdWpj7FzoQL_N0HswX-x_3yL9_7Co",
				dataType: "json", // Need to figure out jsonp
				data:
					"&new_forward_geocoder=true" +
					"&address=" + self.zipcode(),
				success: function(data) {
					console.log("Geocode received")
					clearTimeout(geocodeTimeout);
					lat(data.results[0].geometry.location.lat);
					lng(data.results[0].geometry.location.lng);
					pos = {
						lat: lat(),
						lng: lng(),
					};
					self.map.setCenter(pos);
					console.log(pos)
					self.map.setZoom(11);
					self.createRestaurants();
				},
				error: function(){
					alert('Sorry something went wrong with updating the Map. Please refresh and try again');
				},

			});
		};


		self.filteringMaps = function(){
			var lowerSearch = self.searchValue().toLowerCase();
			for (var i = self.mapRestaurants().length - 1; i >= 0; i--) {
				var lowerName = self.mapRestaurants()[i].name.toLowerCase();
				if(lowerName.includes(lowerSearch)){
					self.mapRestaurants()[i].visible(true);
					for (var x = self.markerArray().length - 1; x >= 0; x--){
						if(self.markerArray()[x].id == self.mapRestaurants()[i].id){
							self.markerArray()[x].setMap(self.map);
						};
					};
					
				} else {
					self.mapRestaurants()[i].visible(false);

					for (var x = self.markerArray().length - 1; x >= 0; x--){
						console.log("test");
						if(self.markerArray()[x].id == self.mapRestaurants()[i].id){
							self.markerArray()[x].setMap(null);
						};
					};
				};
			};

		};


		self.clickOpen = function(data, event){
			for ( var i = 0; i <= self.markerArray().length - 1; i++){
				var currentMark = self.markerArray()[i];
				pos = {
						lat: data.lat,
						lng: data.lng,
					};
				self.map.setCenter(pos);
				currentMark.info.close();
				currentMark.setAnimation(null);
				if (currentMark.id == data.id ){
				currentMark.info.open(self.map, currentMark);
				currentMark.setAnimation(google.maps.Animation.BOUNCE);
				var animationTimeout = setTimeout(function(){
					console.log("test");
					currentMark.setAnimation(null);
					}, 3000);
				
				};
			};
		};
		
	};
	var vm = new MapViewModel();

	ko.applyBindings(vm);
};

// Todos
// When hovering over list item make it bold
// invoke jsonp on geocode api
// Add Timeout on geolocation
// Make a modal and show that when click an open
// Clear Marker Array on intializiation
// Resolve animation issue when selecting a restaurant from list


