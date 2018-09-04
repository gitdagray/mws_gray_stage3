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
  document.getElementById('map').style.display = 'block';
  document.getElementById('mapInt').style.display = 'none';
});

window.addEventListener('online', function(e) {
  console.log('online');

  console.log('now online: sending new faves');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(e => {
      console.log('Fave send failed');
      console.error(e);
    })
});

window.addEventListener('sendFave', function(e) {
  console.log('immediate: sending new faves');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(e => {
      console.log('Fave send failed');
      console.error(e);
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
 });

 /**
  * Map loading decision based upon viewport size
  */
window.onload = () => {
  const size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
  };
  //console.log("width: " + size.width);
  //console.log("height: " + size.height);
  if (size.width > 800){
    document.getElementById('map-link').click();
  }

  //check idb for anything not posted
  console.log('looking in idb for faves...');
  readAllData('sync-newFav')
    .then(data => favEm(data))
    .catch(e => {
      console.log('Fave send failed');
      console.error(e);
    })

  console.log('looking in idb for reviews...');
  readAllData('sync-newRev')
    .then(data => postEm(data))
    .catch(e => {
      console.log('Review send failed');
      console.error(e);
    })

  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      //load static map
      initMap(restaurants);
      updateRestaurants();
    }
  });
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

window.initMap = (restaurants) => {
  const restMap = document.getElementById('map');
  const srcMap = document.createAttribute("src");
  const altMap = document.createAttribute("alt");
  const indexMap = document.createAttribute("tabindex");
  //const latlngMap = restaurant.latlng.lat + ',' + restaurant.latlng.lng;
  let mapURL = 'https://maps.googleapis.com/maps/api/staticmap?';
  mapURL = mapURL + '&size=420x420&scale=1&markers=color:red';
  restaurants.forEach(restaurant => {
    mapURL = mapURL + '%7C' + restaurant.latlng.lat + ',' + restaurant.latlng.lng;
  });
  mapURL = mapURL + '&key=AIzaSyA8iJ1AVyPPTXTKUDzwY8jrB04Ndhdxy0Q';
  console.log(mapURL);
  srcMap.value = mapURL;
  altMap.value = 'A map showing all the restaurants in the Restaurant Reviews App.';
  indexMap.value = 0;
  restMap.setAttributeNode(srcMap);
  restMap.setAttributeNode(altMap);
  restMap.setAttributeNode(indexMap);
}

/**
 * Initialize Google map, called from HTML.
*/
window.initInteractiveMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('mapInt'), {
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

/*
const switchMaps = () => {
  if (navigator.onLine){
    initInteractiveMap();
    document.getElementById('map').style.display = 'none';
    document.getElementById('mapInt').style.display = 'block';
    document.getElementById('map-container').removeEventListener('click',switchMaps);
    document.getElementById('neighborhoods-select').removeEventListener('click',switchMaps);
    document.getElementById('cuisines-select').removeEventListener('click',switchMaps);
  }
}

document.getElementById('map-container').addEventListener('click',switchMaps);
document.getElementById('neighborhoods-select').addEventListener('click',switchMaps);
document.getElementById('cuisines-select').addEventListener('click',switchMaps);
*/
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
      fillRestaurantsHTML(restaurants);
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

  /*
  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];*/
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  /*
  if(navigator.onLine){
    addMarkersToMap(restaurants);
  }*/
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
 */ /*
addMarkersToMap = (restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

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
