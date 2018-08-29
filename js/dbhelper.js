/**
 * Common database helper functions.
 */
class DBHelper {

  static get DATABASE_URL() {
    return 'http://localhost:1337/restaurants';
  }

  static get REVIEWS_URL() {
    return 'http://localhost:1337/reviews';
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants(callback) {

    // async await fetch solution - server data
    try {
      const response = await fetch(DBHelper.DATABASE_URL);
      //console.log(response);
      const restaurants = await response.json();
      console.log(restaurants);
      callback(null, restaurants);
    } catch(e) {
      console.error(e);
      const error = ('Request failed. ' + e);
      callback(error, null);
    }
  }

  /**
   * Fetch all reviews.
   */
  static async fetchReviews(callback) {

    // async await fetch solution - all reviews
    try {
      const response = await fetch(DBHelper.REVIEWS_URL);
      //console.log(response);
      const reviews = await response.json();
      console.log(reviews);
      callback(null, reviews);
    } catch(e) {
      console.error(e);
      const error = ('Request failed. ' + e);
      callback(error, null);
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch reviews by restaurant ID.
   */
  static async fetchReviewsByRestaurantId(restaurant_id, callback) {

    // async await fetch solution - specific restaurant reviews
    try {
      const response = await fetch('http://localhost:1337/reviews/?restaurant_id=' + restaurant_id);
      const reviews = await response.json();
      console.log(reviews);
      callback(null, reviews);
    } catch(e) {
      console.error(e);
      const error = ('Request failed. ' + e);
      callback(error, null);
    }
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    //server data solution
    let imgUrl = restaurant.id;
    imgUrl = '/img/' + imgUrl;
    return (imgUrl);
    /* local data solution
    let imgUrl = restaurant.photograph;
    imgUrl = imgUrl.slice(0,-4);
    imgUrl = '/img/' + imgUrl;
    return (imgUrl);
    */
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
