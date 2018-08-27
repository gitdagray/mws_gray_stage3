/* serviceWorker */

//import idb promised
importScripts('js/idb.js');

//import idb scripts
importScripts('js/util.js');

// name the static cache
const CACHE_STATIC_NAME = 'static-v1';

//name the dynamic cache
const CACHE_DYNAMIC_NAME = 'dynamic-v1';

// define the array of static files
const STATIC_FILES = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/manifest.json',
  '/favicon.ico',
  '/css/styles.css',
  '/js/idb.js',
  '/js/util.js',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/img/icons/app-icon-48x48.png',
  '/img/icons/app-icon-96x96.png',
  '/img/icons/app-icon-192x192.png',
  '/img/icons/app-icon-512x512.png',
  '/img/1_400.jpg',
  '/img/1_800.jpg',
  '/img/2_400.jpg',
  '/img/2_800.jpg',
  '/img/3_400.jpg',
  '/img/3_800.jpg',
  '/img/4_400.jpg',
  '/img/4_800.jpg',
  '/img/5_400.jpg',
  '/img/5_800.jpg',
  '/img/6_400.jpg',
  '/img/6_800.jpg',
  '/img/7_400.jpg',
  '/img/7_800.jpg',
  '/img/8_400.jpg',
  '/img/8_800.jpg',
  '/img/9_400.jpg',
  '/img/9_800.jpg',
  '/img/10_400.jpg',
  '/img/10_800.jpg'
]; /* '/data/restaurants.json', local data version */

// log a message for the active serviceWorker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating service worker...', event);
  //return self.clients.claim(); // this makes the sw kick in immediately
});

// install the serviceWorker and add all static files to cache
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing service worker...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
     .then(cache => {
       console.log('[Service Worker] Precaching App Shell');
       return cache.addAll(STATIC_FILES);
     })
     .catch(err => {
       console.log('error adding static cache');
       console.error(err);
     })
  );
});

// handle fetch requests
self.addEventListener('fetch', event => {

  // Prevent the default, and handle the request ourselves.
  event.respondWith(async function(){

    const url = new URL(event.request.url);
    var dataURL;
    var idbBank;

    //define dataURL
    if(event.request.url.indexOf('http://localhost:1337/restaurants') > -1){
        dataURL = 'http://localhost:1337/restaurants';
        idbBank = 'restaurants';
    } else if (event.request.url.indexOf('http://localhost:1337/reviews') > -1){
        dataURL = 'http://localhost:1337/reviews';
        idbBank = 'reviews';
    }
    //handle data URL request
    if(event.request.url.indexOf(dataURL) > -1){

      //network and update idb first.. with idb fallback
      return getNetworkData(dataURL).then(res => {
          if (res) {
            console.log('from network data source...');
            console.log(dataURL);
            return res; //return network data
          } else { // return idb data
              console.log('idb - idbBank: ' + idbBank);
            return readAllData(idbBank).then(allObjs => {
              if (allObjs.length > 0) {
                console.log('Offline: getting data from idb...');
                let payload = new Response(JSON.stringify(allObjs),{ "status" : 200 , "statusText" : "MyCustomResponse!" });
                return payload;
              }
            }).catch(error => {
              console.log('readAllData error');
              console.error(error);
            });
          }
        });
      } // end handle data request

     // check the static cache
     const staticCache = await caches.open(CACHE_STATIC_NAME);
     const staticResponse = await staticCache.match(url.pathname, {ignoreSearch: true});
     // return if found
     if (staticResponse) {
       console.log('from static cache...');
       console.log(url.pathname);
       return staticResponse;
     }

     //check the dynamic cache
     const dynamicCache = await caches.open(CACHE_DYNAMIC_NAME);
     const dynamicResponse = await dynamicCache.match(url);
     // return if found
     if (dynamicResponse) {
       console.log('from dynamic cache...');
       console.log(url);
       return dynamicResponse;
     }

      //not in either cache...
      //get response from network and store in dynamic cache
      console.log('from network...');
      console.log(url);
      let options;
      try{
        //Google fonts need cors mode
        if(event.request.url.indexOf('fonts.gstatic.com') > -1){
          options = { mode: 'cors' };
        } else {
          options = { mode: 'no-cors' };
        }
        const response = await fetch(url,options);
        if (response) {
          const responseToNetwork = response.clone();
          dynamicCache.put(url, responseToNetwork);
        }
        return response;
      } catch(e) {
        console.log('network error catch');
        console.error(e);
      }

  }()); //end event.respondWith
}); //end addEventListener
