let restaurant;
let reviews;
var map;

/* Register serviceWorker */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
  .register('sw.js')
  .then(function(){
    console.log('Service Worker Registered!');
  })
  .catch(err => {
    console.log(err);
  });
}

getFullDate = (ms) => {
  const myDate = new Date(ms);
  const month = myDate.getMonth() + 1;
  const day = myDate.getDate();
  const year = myDate.getFullYear();
  return month + '/' + day + '/' + year;
}

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
   fetchRestaurantFromURL((error, restaurant) => {
     if (error) { // Got an error!
       console.error(error);
     } else {
       fillBreadcrumb();
       fetchRestaurantReviewsFromURL((error, reviews) => {
         if (error) { // Got an error!
           console.error(error);
         }
       });
     }
   })
 } else {
   document.getElementById('map-link').click();
 }
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
      fetchRestaurantReviewsFromURL((error, reviews) => {
        if (error) { // Got an error!
          console.error(error);
        }
      });
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
  const headlineHolder = document.getElementById('headline-holder');

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const likeButtonHolder = document.getElementById('like-button-holder');

  //conditional ternary operator
  const isFave = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const likeButton = document.createElement('button');
  likeButton.className = 'fave-rest-icon';
  const likeButtonIndex = document.createAttribute("tabindex");
  likeButtonIndex.value = 0;
  likeButton.setAttributeNode(likeButtonIndex);
  const likeButtonAria = document.createAttribute("aria-label");
  likeButtonAria.value = isFave ? restaurant.name + ' is a favorite.' : restaurant.name + ' is not a favorite.';
  likeButton.setAttributeNode(likeButtonAria);
  likeButton.id = 'fave-rest-icon-' + restaurant.id;
  likeButton.style.background = isFave
    ? 'url("img/icons/like.svg") no-repeat'
    : 'url("img/icons/like-not.svg") no-repeat';
  likeButton.onclick = event => handleLikeButtonClick(restaurant.id,!isFave);
  likeButtonHolder.append(likeButton);

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
  if (self.reviews) { // reviews already fetched!
    callback(null, self.reviews)
    return;
  }
  const restaurant_id = self.restaurant.id;
  if (!restaurant_id) {
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

  const revButton = document.createElement('button');
  revButton.innerHTML = 'Add A New Review for<br>' + self.restaurant.name;
  const revButtonID = document.createAttribute("id");
  const revButtonIndex = document.createAttribute("tabindex");
  const revButtonAria = document.createAttribute("aria-label");
  revButtonID.value = 'new-review-button';
  revButtonIndex.value = 0;
  revButtonAria.value = 'Press button to add a new review for ' + self.restaurant.name;
  revButton.setAttributeNode(revButtonID);
  revButton.setAttributeNode(revButtonIndex);
  revButton.setAttributeNode(revButtonAria);
  container.appendChild(revButton);

  //create form for new restaurant reviews
  const newRevForm = document.createElement('form');
  const newRevFormID = document.createAttribute("id");
  const newRevFormName = document.createAttribute("name");
  //const newRevFormAction = document.createAttribute("action");
  const newRevFormOnSubmit = document.createAttribute("onsubmit");
  newRevFormID.value = 'new-review-form';
  newRevFormName.value = 'newReviewForm';
  newRevFormOnSubmit.value = 'validateNewReview()';
  newRevForm.setAttributeNode(newRevFormID);
  newRevForm.setAttributeNode(newRevFormID);
  newRevForm.setAttributeNode(newRevFormName);
  container.appendChild(newRevForm);
  //grab form that was just created...
  const myNewRevForm = document.getElementById('new-review-form');

  //add hidden thank you paragraph
  const thankYouPara = document.createElement('p');
  const thankYouIndex = document.createAttribute("tabindex");
  const thankYouID = document.createAttribute("id");
  thankYouIndex.value = 0;
  thankYouID.value = 'thankYou';
  thankYouPara.setAttributeNode(thankYouIndex);
  thankYouPara.setAttributeNode(thankYouID);
  container.appendChild(thankYouPara);

  //add name label...
  const newRevNameLabel = document.createElement('label');
  newRevNameLabel.innerHTML = 'Please enter your name:';
  const newRevNameLabelID = document.createAttribute("id");
  const newRevNameLabelFor = document.createAttribute("for");
  newRevNameLabelID.value = 'newRevNameLabel';
  newRevNameLabelFor.value = 'newRevName';
  newRevNameLabel.setAttributeNode(newRevNameLabelID);
  newRevNameLabel.setAttributeNode(newRevNameLabelFor);
  myNewRevForm.appendChild(newRevNameLabel);
  //add name input...
  const newRevNameInput = document.createElement('input');
  const newRevNameInputIndex = document.createAttribute("tabindex");
  const newRevNameInputID = document.createAttribute("id");
  const newRevNameAria = document.createAttribute("aria-labelledby");
  const newRevNameInputType = document.createAttribute("type");
  const newRevNameInputName = document.createAttribute("name");
  const newRevNameInputPlaceholder = document.createAttribute("placeholder");
  const newRevNameInputMaxlength = document.createAttribute("maxlength");
  const newRevNameInputRequired = document.createAttribute("required");
  newRevNameInputIndex.value = 0;
  newRevNameInputID.value = 'newRevName';
  newRevNameAria.value = 'newRevNameLabel';
  newRevNameInputType.value = 'text';
  newRevNameInputName.value = 'revname';
  newRevNameInputPlaceholder.value = 'Your Name';
  newRevNameInputMaxlength.value = 20;
  newRevNameInput.setAttributeNode(newRevNameInputIndex);
  newRevNameInput.setAttributeNode(newRevNameInputID);
  newRevNameInput.setAttributeNode(newRevNameAria);
  newRevNameInput.setAttributeNode(newRevNameInputType);
  newRevNameInput.setAttributeNode(newRevNameInputName);
  newRevNameInput.setAttributeNode(newRevNameInputPlaceholder);
  newRevNameInput.setAttributeNode(newRevNameInputMaxlength);
  newRevNameInput.setAttributeNode(newRevNameInputRequired);
  myNewRevForm.appendChild(newRevNameInput);

  //add rating label...
  const newRevRatingLabel = document.createElement('label');
  newRevRatingLabel.innerHTML = 'Please choose a rating:';
  const newRevRatingLabelID = document.createAttribute("id");
  const newRevRatingLabelFor = document.createAttribute("for");
  newRevRatingLabelID.value = 'newRevRatingLabel';
  newRevRatingLabelFor.value = 'newRevRating';
  newRevRatingLabel.setAttributeNode(newRevRatingLabelID);
  newRevRatingLabel.setAttributeNode(newRevRatingLabelFor);
  myNewRevForm.appendChild(newRevRatingLabel);
  //add rating select...
  const newRevRating = document.createElement('select');
  const newRevRatingIndex = document.createAttribute("tabindex");
  const newRevRatingID = document.createAttribute("id");
  const newRevRatingName = document.createAttribute("name");
  const newRevRatingAria = document.createAttribute("aria-labelledby");
  newRevRatingIndex.value = 0;
  newRevRatingID.value = 'newRevRating';
  newRevRatingName.value = 'newRevRating';
  newRevRatingAria.value = 'newRevRatingLabel';
  newRevRating.setAttributeNode(newRevRatingIndex);
  newRevRating.setAttributeNode(newRevRatingID);
  newRevRating.setAttributeNode(newRevRatingName);
  newRevRating.setAttributeNode(newRevRatingAria);
  myNewRevForm.appendChild(newRevRating);
  //grab form that was just created...
  const myNewRevRating = document.getElementById('newRevRating');
  //add options for select...
  const revRating5 = document.createElement('option');
  const revRating4 = document.createElement('option');
  const revRating3 = document.createElement('option');
  const revRating2 = document.createElement('option');
  const revRating1 = document.createElement('option');
  revRating5.innerHTML = '5: Awesome!';
  revRating4.innerHTML = '4: Above Average';
  revRating3.innerHTML = '3: Average';
  revRating2.innerHTML = '2: Below Average';
  revRating1.innerHTML = '1: Awful';
  const revRating5val = document.createAttribute("value");
  const revRating4val = document.createAttribute("value");
  const revRating3val = document.createAttribute("value");
  const revRating2val = document.createAttribute("value");
  const revRating1val = document.createAttribute("value");
  const revRating5sel = document.createAttribute("selected");
  revRating5val.value = 5;
  revRating4val.value = 4;
  revRating3val.value = 3;
  revRating2val.value = 2;
  revRating1val.value = 1;
  revRating5.setAttributeNode(revRating5val);
  revRating5.setAttributeNode(revRating5sel);
  revRating4.setAttributeNode(revRating4val);
  revRating3.setAttributeNode(revRating3val);
  revRating2.setAttributeNode(revRating2val);
  revRating1.setAttributeNode(revRating1val);
  myNewRevRating.appendChild(revRating5);
  myNewRevRating.appendChild(revRating4);
  myNewRevRating.appendChild(revRating3);
  myNewRevRating.appendChild(revRating2);
  myNewRevRating.appendChild(revRating1);

  //add name label...
  const newRevCommentsLabel = document.createElement('label');
  newRevCommentsLabel.innerHTML = 'Review Comments:';
  const newRevCommentsLabelID = document.createAttribute("id");
  const newRevCommentsLabelFor = document.createAttribute("for");
  newRevCommentsLabelID.value = 'newRevCommentsLabel';
  newRevCommentsLabelFor.value = 'newRevComments';
  newRevCommentsLabel.setAttributeNode(newRevCommentsLabelID);
  newRevCommentsLabel.setAttributeNode(newRevCommentsLabelFor);
  myNewRevForm.appendChild(newRevCommentsLabel);
  //add comments input...
  const newRevComments = document.createElement('textarea');
  const newRevCommentsInputIndex = document.createAttribute("tabindex");
  const newRevCommentsInputID = document.createAttribute("id");
  const newRevCommentsAria = document.createAttribute("aria-labelledby");
  const newRevCommentsInputName = document.createAttribute("name");
  const newRevCommentsInputMaxlength = document.createAttribute("maxlength");
  newRevCommentsInputIndex.value = 0;
  newRevCommentsInputID.value = 'newRevComments';
  newRevCommentsAria.value = 'newRevCommentsLabel';
  newRevCommentsInputName.value = 'revcomments';
  newRevCommentsInputMaxlength.value = 250;
  newRevComments.setAttributeNode(newRevCommentsInputIndex);
  newRevComments.setAttributeNode(newRevCommentsInputID);
  newRevComments.setAttributeNode(newRevCommentsAria);
  newRevComments.setAttributeNode(newRevCommentsInputName);
  newRevComments.setAttributeNode(newRevCommentsInputMaxlength);
  myNewRevForm.appendChild(newRevComments);

  // create submit button
  const subRevButton = document.createElement('button');
  subRevButton.innerHTML = 'Submit A New Review for<br>' + self.restaurant.name;
  const subRevButtonID = document.createAttribute("id");
  const subRevButtonIndex = document.createAttribute("tabindex");
  const subRevButtonAria = document.createAttribute("aria-label");
  subRevButtonID.value = 'sub-review-button';
  subRevButtonIndex.value = 0;
  subRevButtonAria.value = 'Press this button to add a new review for ' + self.restaurant.name;
  subRevButton.setAttributeNode(subRevButtonID);
  subRevButton.setAttributeNode(subRevButtonIndex);
  subRevButton.setAttributeNode(subRevButtonAria);
  myNewRevForm.appendChild(subRevButton);

  //add toggle for new review button and review form...
  document.getElementById("new-review-button").addEventListener("click", () => {
    document.getElementById("new-review-form").style.display = 'block';
    document.getElementById("new-review-button").style.display = 'none';
  });

  //listen for the new review submit event on the form...
  document.getElementById("new-review-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const idRevData = self.restaurant.id;
    const nameRevData = document.getElementById('newRevName').value;
    const ratingRevData = document.getElementById('newRevRating').value;
    const commentsRevData = document.getElementById('newRevComments').value;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
      //testing the sendNewReview function
        .then(sw => {
          const newReviewData = {
            "restaurant_id": idRevData,
            "name": nameRevData,
            "rating": ratingRevData,
            "comments": commentsRevData
          };
          console.log('newReviewData: ' + JSON.stringify(newReviewData));
          writeData('sync-newRev', newReviewData)
            .then(() => sw.sync.register('sync-new-review'))
            .then(showReviewThankYou(nameRevData))
            .catch(err => console.log(err));
        });
    } else {
      sendNewReview(); //fallback if no support for SyncManager
    }
  });

  //get the reviews and display them...
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

async function sendNewReview() {
  try {
      let idData = self.restaurant.id;
      let nameData = document.getElementById('newRevName').value;
      let ratingData = document.getElementById('newRevRating').value;
      let commentsData = document.getElementById('newRevComments').value;

      const revResponse = await fetch('http://localhost:1337/reviews/',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          restaurant_id: idData,
          name: nameData,
          rating: ratingData,
          comments: commentsData
        })
      })

      const myRevReply = await revResponse.json();
      console.log('myRevReply: ' + JSON.stringify(myRevReply));
      showReviewThankYou(nameData);
    } catch(e) {
      console.log('Post failed.');
      console.error(e);
    }
}

showReviewThankYou = (name) => {
  document.getElementById('thankYou').innerHTML = "Thank you for submitting a review " + name + "!";
  document.getElementById('thankYou').style.display = "block";
  document.getElementById('new-review-form').style.display = 'none';
}

handleLikeButtonClick = (id,newState) => {
  const fav = document.getElementById('fave-rest-icon-' + id);
  self.restaurant["is_favorite"] = newState;

  fav.style.background = newState
    ? 'url("img/icons/like.svg") no-repeat'
    : 'url("img/icons/like-not.svg") no-repeat';
  newState
    ? fav.setAttribute("aria-label", self.restaurant.name + ' is a favorite.')
    : fav.setAttribute("aria-label", self.restaurant.name + ' is not a favorite.');

  fav.onclick = event => handleLikeButtonClick(id, !newState);
  handleFaveClick(id,newState);
}
