//open idb database
const dbPromise = idb.open('restaurants-db', 1, db => {
  //create data store if it does not exist
  if (!db.objectStoreNames.contains('restaurants')){
    db.createObjectStore('restaurants', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('reviews')){
    db.createObjectStore('reviews', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('sync-newRev')){
    db.createObjectStore('sync-newRev', {keyPath: 'id', autoIncrement: true});
  }
  if (!db.objectStoreNames.contains('sync-newFav')){
    db.createObjectStore('sync-newFav', {keyPath: 'id', autoIncrement: true});
  }
});

//write data to idb
function writeData(store,data){
  return dbPromise.then(db => {
    const tx = db.transaction(store,'readwrite');
    tx.objectStore(store).put(data);
    return tx.complete;
  });
}

//read all data from idb
function readAllData(store){
  return dbPromise.then(db => {
    const tx = db.transaction(store,'readonly');
    const st = tx.objectStore(store);
    const allSavedItems = st.getAll();
    return allSavedItems;
  });
}

//delete an item from idb
function deleteAnItem(store, id) {
  dbPromise
    .then(db => {
      const tx = db.transaction(store,'readwrite');
      const st = tx.objectStore(store);
      st.clear();
      return tx.complete;
    });
}

function handleFaveClick(id,newState){
  console.log('newState: ' + newState);
  //conditional ternary operator
  const faveURL = newState.toString() === 'true'
    ? 'http://localhost:1337/restaurants/' + id + '/?is_favorite=true'
    : 'http://localhost:1337/restaurants/' + id + '/?is_favorite=false';
  console.log('faveURL: ' + faveURL);

  //register sync here
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    console.log('sync reg route');
    navigator.serviceWorker.ready
    //testing the sendNewReview function
      .then(sw => {
        writeData('sync-newFav', {"url": faveURL})
          .then(() => sw.sync.register('sync-new-fave'))
          .catch(err => console.log(err));
      });
  } else {
    console.log('fallback route');
    //fallback function
    sendNewFave(faveURL,id,newState);
  }
}

//fallback function to send fave data
async function sendNewFave(url,id,newState) {
  try {
        const faveResponse = await fetch(url,{
          method: 'PUT'
        })
        const myFaveReply = await faveResponse.json();
        console.log('myFaveReply: ' + JSON.stringify(myFaveReply));
      } catch(e) {
        console.log('Fave failed.');
        console.error(e);
      }
}

//get network data
async function getNetworkData(dataURL){
  try {
    //get server data
    const dataResponse = await fetch(dataURL);
    //store data in idb
    console.log(dataResponse.status);
    if (dataResponse.status == 200) {
      const responseToData = dataResponse.clone();
      const returnedData = await responseToData.json();
      //console.log('sw.js restaurants: ' + JSON.stringify(restaurants[0].name));
      if(dataURL.indexOf('http://localhost:1337/restaurants') > -1){
        for (let key in returnedData){
          writeData('restaurants',returnedData[key]);
        }
      } else if (dataURL.indexOf('http://localhost:1337/reviews') > -1){
        for (let key in returnedData){
          writeData('reviews',returnedData[key]);
        }
      }
      return dataResponse;
    }
  } catch(error) {
    console.log('getNetworkData: must be OFFLINE');
    console.error(error);
  }
}
