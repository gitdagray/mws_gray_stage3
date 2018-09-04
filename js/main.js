let restaurants,
  neighborhoods,
  cuisines
var map
//var markers = []

/* Register serviceWorker */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
  .register('sw.js')
  .then(function(){
    console.log('Service Worker Registered!');
  })
  .catch(function(err){
    console.log(err);
  });
}

window.addEventListener('offline', function(e) {
  console.log('offline');
  console.log(e);
});

window.addEventListener('online', function(e) {
  console.log('online');

  console.log('now online: sending new faves');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(err => {
      console.log('Fave send failed');
      console.error(err);
    })

  console.log('now online: sending new reviews');
  readAllData('sync-newRev')
    .then(data => postEm(data))
    .catch(err => {
      console.log('Review send failed');
      console.error(err);
    })

});

window.addEventListener('sendFave', function(e) {
  console.log('immediate: sending new faves');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(err => {
      console.log('Fave send failed');
      console.error(err);
    })
});

/**
 * Allow user option to display map in mobile viewports
 */
 document.getElementById('map-link').addEventListener('click', (event) => {
   const disLink = document.getElementById('map-link-option');
   disLink.style.display = 'none';
   const mapContain = document.getElementById('map-container');
   mapContain.style.display = 'block';
   initMap();
 });

 /**
  * Map loading decision based upon viewport size
  */
mapDecisions = () => {
  const size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
  };
  //console.log("width: " + size.width);
  //console.log("height: " + size.height);
  if (size.width < 801){
    updateRestaurants();
  } else {
    document.getElementById('map-link').click();
  }

  //check idb for anything not posted
  console.log('looking in idb for faves...');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(err => {
      console.log('Fave send failed');
      console.error(err);
    })

  console.log('looking in idb for reviews...');
  readAllData('sync-newRev')
    .then(data => postEm(data))
    .catch(err => {
      console.log('Review send failed');
      console.error(err);
    })
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
*/
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  //add title to iframe for Google Map
  google.maps.event.addListenerOnce(map, 'idle', () => {
    document.getElementsByTagName('iframe')[0].title = "Google Maps";
  })
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if(self.markers){
    self.markers.forEach(m => m.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + "_800.jpg";
  image.sizes = "(max-width: 400px) 100vw, (min-width: 401px) 50vw";
  image.srcset = DBHelper.imageUrlForRestaurant(restaurant) + "_400.jpg 400w, " + DBHelper.imageUrlForRestaurant(restaurant) + "_800.jpg 800w";
  image.title = restaurant.name;
  image.alt = "Image of the " + restaurant.name + " restaurant.";
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  const nameIndex = document.createAttribute("tabindex");
  nameIndex.value = 0;
  name.setAttributeNode(nameIndex);
  li.append(name);

  //conditional ternary operator
  const isFave = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const likeButton = document.createElement('button');
  likeButton.className = 'fave-icon';
  const likeButtonIndex = document.createAttribute("tabindex");
  likeButtonIndex.value = 0;
  likeButton.setAttributeNode(likeButtonIndex);
  const likeButtonAria = document.createAttribute("aria-label");
  likeButtonAria.value = isFave ? restaurant.name + ' is a favorite.' : restaurant.name + ' is not a favorite.';
  likeButton.setAttributeNode(likeButtonAria);
  likeButton.id = 'fave-icon-' + restaurant.id;
  likeButton.style.background = isFave
    ? 'url("img/icons/like.svg") no-repeat'
    : 'url("img/icons/like-not.svg") no-repeat';
  likeButton.onclick = event => handleLikeButtonClick(restaurant.id,!isFave);
  li.append(likeButton);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  const neighborhoodIndex = document.createAttribute("tabindex");
  neighborhoodIndex.value = 0;
  neighborhood.setAttributeNode(neighborhoodIndex);
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  const addressIndex = document.createAttribute("tabindex");
  addressIndex.value = 0;
  address.setAttributeNode(addressIndex);
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  const ariaDetails = document.createAttribute("aria-label");
  ariaDetails.value = "Click for more details about " + restaurant.name + ".";
  more.setAttributeNode(ariaDetails);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

handleLikeButtonClick = (id,newState) => {
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      const fav = document.getElementById('fave-icon-' + id);
      const idMinusOne = id - 1;
      restaurants[idMinusOne]["is_favorite"] = newState;

      fav.style.background = newState
        ? 'url("img/icons/like.svg") no-repeat'
        : 'url("img/icons/like-not.svg") no-repeat';
      newState
        ? fav.setAttribute("aria-label", restaurants[idMinusOne].name + ' is a favorite.')
        : fav.setAttribute("aria-label", restaurants[idMinusOne].name + ' is not a favorite.');

      fav.onclick = event => handleLikeButtonClick(id, !newState);
      handleFaveClick(id,newState);
    }
  });
}
