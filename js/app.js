
var pos;
/**
	* @description Intializes the Map and View Model
*/
function init(){

	/**
	* @description Intializes the View Model
	* @class
	*/
	function MapViewModel(){
		var self = this;
		
		lat = ko.observable(34.0522);
		lng = ko.observable(-118.2437);
		this.mapRestaurants = ko.observableArray([]);
		this.markerArray = ko.observableArray([]);
		this.zipcode = ko.observable();
		this.searchValue = ko.observable();
		this.boldText = ko.observable();

		$(".button-collapse").sideNav();

		// Google Map
		self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 13,
			center: new google.maps.LatLng(lat(), lng()),
			disableDefaultUI: true,
		});

		

		/**
		* @description Gets users current location if avalible
		*/
		self.getLocation = function(){
			if (navigator.geolocation) {
				var geoLocationTimeout = setTimeout(function(){
				alert('Sorry failed to get location, refresh or enter your zipcode');
				}, 8000); 
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
				clearTimeout(geoLocationTimeout);
				});
			} else {
				alert('Sorry location does not seem to be avalible on your browser' +
					'. Try entering in your zip');
			};
		};

		/**
		* @description Sets the current date
		* @returns {string} The current date
		*/
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

		/**
		* @description Calls the FourSquare API and sets results to self.MapRestaurants()
		* Creates subsequent map markers for all in the array
		*/
		self.createRestaurants = function(){
			// FourSquare Client Details.
			var today = self.setDate();
			var fourSquareTimeout = setTimeout(function(){
			alert('Failed to get restaurant from FourSquare.' +
				'Please make sure that you are looking in the US, refresh and try again');
			}, 8000);

			$.ajax({
			url: "https://api.foursquare.com/v2/venues/explore?ll=" + lat() + "," + lng(),
			dataType: 'jsonp',
			data: 
				"client_id=" + CLIENT_ID +
				"&client_secret=" + CLIENT_SECRET +
				"&radius=80000" +
				"&query=vietnamese" +
				"&venuePhotos=1" +
				"&v=" + today,
				
				success: function(data) {
					// Success message
					console.log('Four Square Data Received');
					
					// Set returns to results
					if (data.response.groups[0].items){
						var results = data.response.groups[0].items;
						self.mapRestaurants.removeAll();
						for (var i = results.length - 1; i >= 0; i--) {
							var tip;
							if(results[i].tips){
								tip = results[i].tips[0].text;
							} else {
								tip = "No Comments";
							};
							var currentRestaurant = results[i].venue;
							var restImageUrl = currentRestaurant.featuredPhotos.items[0].prefix +
								"100x100" + currentRestaurant.featuredPhotos.items[0].suffix;
							var restaurant = {
								id: currentRestaurant.id,
								name: currentRestaurant.name,
								address: currentRestaurant.location.formattedAddress[0],
								phone: currentRestaurant.contact.formattedPhone,
								website: currentRestaurant.url,
								image: restImageUrl,
								rating: currentRestaurant.rating,
								price: currentRestaurant.price.message,
								tip: tip,
								lat: currentRestaurant.location.lat,
								lng: currentRestaurant.location.lng,
								visible: ko.observable(true),
							};
							// Push restaurant object to restaurants array
							self.mapRestaurants.push(restaurant);
						};
						// Clear the Timeout Error
						clearTimeout(fourSquareTimeout);
						self.createMarkers();
						} else {
							alert('Sorry it seems we did not find any restaurants' + 
								' in your searched area. Make sure you are searching' + 
								' in the US and try another zip code.')
						};
				},
				// Error if fails
				error: function(){
					alert('Sorry data failed to load')
				} 
			});

		};

		// Create initial set of restaurants on default
		self.createRestaurants();

		/**
		* @description Clears all markers on map
		*/
		self.clearMarkers = function(){
			if (self.markerArray().length > 0){
				for (var i = 0; i < self.markerArray().length; i++){
						self.markerArray()[i].setMap(null);
					}
					self.markerArray().length = 0;
				};
		};

		/**
		* @description Creates markers on the map with infowindows
		*/
		self.createMarkers = function(){
			self.clearMarkers();
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
				var markerContent = '<div class="row">' + 
					'<div class="col s12">' + 
					'<img class="circle responsive-img rest-img" src="' +
					currentRestaurant.image + '">'+ '</div>' +
					'<div class="col s12 purple rest-name">' + 
					'<h6 class="center-align">' +
					currentRestaurant.name +
					'</h6></div>' + 
					'<div class="col s12">' +
					'<p><i>' + currentRestaurant.tip + '</i><br><br>' + 
					'Rating: ' + currentRestaurant.rating +
					' Price: ' + currentRestaurant.price +
					'<br><p>' + currentRestaurant.address +
					'<br>' +
					currentRestaurant.phone +
					'<br>' +
					'<a href="' + currentRestaurant.website +
					'">View Menu</a></p><br><br>' +
					'<p>Information from FourSquare</p></div></div>';

				self.marker.info = new google.maps.InfoWindow({
					content: markerContent
				});
				self.markerArray.push(self.marker);

				self.marker.addListener('click', (function(markerCopy){
					return function(){
						self.markerAction(markerCopy);
					};
				})(self.marker));
			};
		};

		/**
		* @description Updates the map center when the user enters a new zipcode
		*/
		self.onMapUpdate = function(data){
			var geocodeTimeout = setTimeout(function(){
			alert('Sorry something went wrong with updating the Map. Please refresh and try again');
			}, 8000);
			$.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/" +
					"json?key=AIzaSyDxLsPdWpj7FzoQL_N0HswX-x_3yL9_7Co",
				dataType: "json", 
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
					self.map.setZoom(11);
					self.createRestaurants();
				},
				error: function(){
					alert('Sorry something went wrong with updating the Map.' +
						' Please refresh and try again');
				},

			});
		};

		/**
		* @description Causes a marker to open and change icon when applied to a listener
		* @param {Object} marker - The marker in which to apply the actions to
		*/
		self.markerAction = function(marker){
			for (var i = self.markerArray().length - 1; i >= 0; i--) { 
				self.markerArray()[i].info.close();
				self.markerArray()[i].setIcon('images/icon.png');
			};
			marker.info.open(self.map, marker);
			marker.setIcon('images/icon2.png');
			self.map.setCenter(marker.position);
		};

		/**
		* @description On search filters restaurants and sets all visible to visible(true)
		*/
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
						if(self.markerArray()[x].id == self.mapRestaurants()[i].id){
							self.markerArray()[x].setMap(null);
						};
					};
				};
			};
		};

		/**
		* @description Opens a marker when restaurant is clicked on list
		*/
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
				self.markerAction(currentMark);
				};
			};
		};
	};
	var vm = new MapViewModel();

	ko.applyBindings(vm);
};





