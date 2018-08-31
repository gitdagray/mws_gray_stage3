# Restaurants Project - Stage 3

### Notes on Development Environment
- Serve web app pages with the Python server.
- The server repository mentioned below is a Node server that provides the data endpoints.
- During development, both the Python and Node servers can run in separate CLI windows.

## Steps to complete
#### 1. Fork and clone the server repository. You’ll use this development server to develop your project code.
Server repository found here:
```
https://github.com/udacity/mws-restaurant-stage-3
```
#### 2. Add a form to allow users to submit their own reviews.
#### 3. Add functionality to defer submission of the form until connection is re-established.
#### 4. Follow the recommendations provided by Lighthouse to achieve the required performance targets.
Performance, PWA, and Accessiblity scores above 90
#### 5. Submit your project code for review.

# Project Rubric
#### Your project will be evaluated by a Udacity code reviewer according to the Restaurant Reviews: Stage 3 rubric.
Rubric found here:
```
https://review.udacity.com/#!/rubrics/1132/view
```

#### Server repository instructions:
# Local Development API Server
## Usage
#### Get Restaurants
```
curl "http://localhost:1337/restaurants"
```
#### Get Restaurants by id
````
curl "http://localhost:1337/restaurants/{3}"
````

## Architecture
Local server
- Node.js
- Sails.js

## Contributors

- [Brandy Lee Camacho - Technical Project Manager](mailto:brandy.camacho@udacity.com)
- [David Harris - Web Services Lead](mailto:david.harris@udacity.com)
- [Omar Albeik - Frontend engineer](mailto:omaralbeik@gmail.com)

## Getting Started

### Development local API Server
_Location of server = /server_
Server depends on [node.js LTS Version: v6.11.2 ](https://nodejs.org/en/download/), [npm](https://www.npmjs.com/get-npm), and [sails.js](http://sailsjs.com/)
Please make sure you have these installed before proceeding forward.

Great, you are ready to proceed forward; awesome!

Let's start with running commands in your terminal, known as command line interface (CLI)

###### Install project dependancies
```Install project dependancies
# npm i
```
###### Install Sails.js globally
```Install sails global
# npm i sails -g
```
###### Start the server
```Start server
# node server
```
### You should now have access to your API server environment
debug: Environment : development
debug: Port        : 1337


## Endpoints

### GET Endpoints

#### Get all restaurants
```
http://localhost:1337/restaurants/
```

#### Get favorite restaurants
```
http://localhost:1337/restaurants/?is_favorite=true
```

#### Get a restaurant by id
```
http://localhost:1337/restaurants/<restaurant_id>
```

#### Get all reviews for a restaurant
```
http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
```

#### Get all restaurant reviews
```
http://localhost:1337/reviews/
```

#### Get a restaurant review by id
```
http://localhost:1337/reviews/<review_id>
```

#### Get all reviews for a restaurant
```
http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
```


### POST Endpoints

#### Create a new restaurant review
```
http://localhost:1337/reviews/
```

###### Parameters
```
{
    "restaurant_id": <restaurant_id>,
    "name": <reviewer_name>,
    "rating": <rating>,
    "comments": <comment_text>
}
```


### PUT Endpoints

#### Favorite a restaurant
```
http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
```

#### Unfavorite a restaurant
```
http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false
```

#### Update a restaurant review
```
http://localhost:1337/reviews/<review_id>
```

###### Parameters
```
{
    "name": <reviewer_name>,
    "rating": <rating>,
    "comments": <comment_text>
}
```


### DELETE Endpoints

#### Delete a restaurant review
```
http://localhost:1337/reviews/<review_id>
```


If you find a bug in the source code or a mistake in the documentation, you can help us by
submitting an issue to our [Waffle Dashboard](https://waffle.io/udacity/mwnd-issues). Even better you can submit a Pull Request with a fix :)
