
var pos;
/**
	* @description Success callback intializes the Map and View Model
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

			}).done(function(data) {
				// Success message
					console.log('Four Square Data Received');

					// Fallback in the off chance a restaurant doesn't have an id. Assign one
					var idDefault = 0;
					// Set returns to results
					if (data.response.groups){
						var results = data.response.groups[0].items;
						self.mapRestaurants.removeAll();
						for (var i = results.length - 1; i >= 0; i--) {
							var id, name, address, phone, website, image, rating, price, tip;
							var currentRestaurant = results[i].venue;
							var cRestLoc = currentRestaurant.location;
							var cRestCnt = currentRestaurant.contact;
							var cRestPht = currentRestaurant.featuredPhotos;


							currentRestaurant.id ? id = currentRestaurant.id : id = idDefault++;
							currentRestaurant.name ? name = currentRestaurant.name : name = "no name provided";
							cRestLoc.formattedAddress[0] ? address = cRestLoc.formattedAddress[0] : address = "no address provided";
							cRestCnt.formattedPhone ? phone = cRestCnt.formattedPhone : phone = "no phone provided";
							currentRestaurant.url ? website = currentRestaurant.url : website = "no website provided";
							currentRestaurant.rating ? rating = currentRestaurant.rating : rating = "N/A";
							currentRestaurant.price.message ? price = currentRestaurant.price.message : price ="not avalible";
							results[i].tips ? tip = results[i].tips[0].text : tip = "no comments avalible";

							if (cRestPht.items[0].prefix && cRestPht.items[0].suffix) {
								image = currentRestaurant.featuredPhotos.items[0].prefix +
								"100x100" + currentRestaurant.featuredPhotos.items[0].suffix;
							} else {
								image = "http://placehold.it/100x100";
							};

							var restaurant = {
								id: id,
								name: name,
								address: address,
								phone: phone,
								website: website,
								image: image,
								rating: rating,
								price: price,
								tip: tip,
								lat: currentRestaurant.location.lat,
								lng: currentRestaurant.location.lng,
								visible: ko.observable(true),
							};
							// Push restaurant object to restaurants array
							self.mapRestaurants.push(restaurant);
						};
						self.createMarkers();
						} else {
							alert('Sorry it seems we did not find any restaurants' + 
								' in your searched area. Make sure you are searching' + 
								' in the US and try another zip code.')
						};
			}).fail(function(jqXHR, textStatus) {
				alert('Sorry data failed to load');
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

				// Change icon back to default when info window closed
				self.marker.info.addListener('closeclick', (function(markerCopy){
					return function(){
						markerCopy.setIcon('images/icon.png');
					};
				})(self.marker));
			};
		};

		/**
		* @description Updates the map center when the user enters a new zipcode
		*/
		self.onMapUpdate = function(data){
			$.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/" +
					"json?key=AIzaSyDxLsPdWpj7FzoQL_N0HswX-x_3yL9_7Co",
				dataType: "json", 
				data:
					"&new_forward_geocoder=true" +
					"&address=" + self.zipcode(),

			}).done(function(data) {
				console.log("Geocode received")
					lat(data.results[0].geometry.location.lat);
					lng(data.results[0].geometry.location.lng);
					pos = {
						lat: lat(),
						lng: lng(),
					};
					self.map.setCenter(pos);
					self.map.setZoom(11);
					self.createRestaurants();

			}).fail(function(jqXHR, textStatus) {
				alert('Sorry something went wrong with updating the Map.' +
						' Please refresh and try again');
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

/**
* @description Error callback if map doesn't load
*/
mapLoadError = function(){
	alert('Sorry the map failed to load. Please refresh and try again');
};





