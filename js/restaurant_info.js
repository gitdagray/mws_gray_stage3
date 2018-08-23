let restaurant;
let reviews;
var map;

/* Register serviceWorker */
/*
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
*/

getFullDate = (ms) => {
  const myDate = new Date(ms);
  const month = myDate.getMonth() + 1;
  const day = myDate.getDate();
  const year = myDate.getFullYear();
  return month + '/' + day + '/' + year;
}


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  const mapContain = document.getElementById('map-container');
  mapContain.style.display = 'block';
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      //add title to iframe for Google Map
      google.maps.event.addListenerOnce(map, 'idle', () => {
        document.getElementsByTagName('iframe')[0].title = "Google Maps";
      })
    }
  });
  fetchRestaurantReviewsFromURL((error, reviews) => {
    if (error) { // Got an error!
      console.error(error);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const ariaAddress = document.createAttribute("aria-label");
  ariaAddress.value = "The address for " + restaurant.name + " is " + restaurant.address + ".";
  address.setAttributeNode(ariaAddress);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + "_800.jpg";
  image.sizes = "(max-width: 400px) 100vw, (min-width: 401px) 50vw";
  image.srcset = DBHelper.imageUrlForRestaurant(restaurant) + "_400.jpg 400w, " + DBHelper.imageUrlForRestaurant(restaurant) + "_800.jpg 800w";
  image.title = restaurant.name;
  image.alt = "Image of the " + restaurant.name + " restaurant.";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  const ariaCuisine = document.createAttribute("aria-label");
  ariaCuisine.value = "Cuisine type of " + restaurant.name + " is " + restaurant.cuisine_type + ".";
  cuisine.setAttributeNode(ariaCuisine);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
    day.innerHTML = key;
    const dayScope = document.createAttribute("scope");
    const dayIndex = document.createAttribute("tabindex");
    dayScope.value = "row";
    dayIndex.value = 0;
    day.setAttributeNode(dayScope);
    day.setAttributeNode(dayIndex);
    row.appendChild(day);

    const time = document.createElement('td');
    const timeIndex = document.createAttribute("tabindex");
    time.innerHTML = operatingHours[key];
    timeIndex.value = 0;
    time.setAttributeNode(timeIndex);
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantReviewsFromURL = (callback) => {
  if (self.reviews) { // restaurant already fetched!
    callback(null, self.reviews)
    return;
  }
  const restaurant_id = getParameterByName('id');
  if (!restaurant_id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(restaurant_id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  const titleIndex = document.createAttribute("tabindex");
  title.innerHTML = 'Reviews';
  titleIndex.value = 0;
  title.setAttributeNode(titleIndex);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('div');
  const nameClass = document.createAttribute("class");
  const ariaRevName = document.createAttribute("aria-label");
  const nameIndex = document.createAttribute("tabindex");
  name.innerHTML = review.name;
  nameClass.value = "review-name";
  ariaRevName.value = "Review by " + review.name + ".";
  nameIndex.value = 0;
  name.setAttributeNode(nameClass);
  name.setAttributeNode(ariaRevName);
  name.setAttributeNode(nameIndex);
  li.appendChild(name);

  const date = document.createElement('div');
  const dateClass = document.createAttribute("class");
  const ariaRevDate = document.createAttribute("aria-label");
  const dateIndex = document.createAttribute("tabindex");
  const reviewDate = getFullDate(review.updatedAt);
  date.innerHTML = reviewDate;
  dateClass.value = "review-date";
  ariaRevDate.value = "Review posted on " + reviewDate + ".";
  dateIndex.value = 0;
  date.setAttributeNode(dateClass);
  date.setAttributeNode(ariaRevDate);
  date.setAttributeNode(dateIndex);
  li.appendChild(date);

  const rating = document.createElement('div');
  const ratingClass = document.createAttribute("class");
  const ariaRevRating = document.createAttribute("aria-label");
  const ratingIndex = document.createAttribute("tabindex");
  rating.innerHTML = `Rating: ${review.rating}`;
  ratingClass.value = "review-rating";
  ariaRevRating.value = review.name + " gave a rating of " + review.rating + ".";
  ratingIndex.value = 0;
  rating.setAttributeNode(ratingClass);
  rating.setAttributeNode(ariaRevRating);
  rating.setAttributeNode(ratingIndex);
  li.appendChild(rating);

  const comments = document.createElement('p');
  const commentsClass = document.createAttribute("class");
  //const ariaRevComments = document.createAttribute("aria-label");
  const commentsIndex = document.createAttribute("tabindex");
  comments.innerHTML = review.comments;
  commentsClass.value = "review-comments";
  //ariaRevComments.value = "Review comments";
  commentsIndex.value = 0;
  comments.setAttributeNode(commentsClass);
  //comments.setAttributeNode(ariaRevComments);
  comments.setAttributeNode(commentsIndex);
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
