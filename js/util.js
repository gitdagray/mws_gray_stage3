//open idb database
const dbPromise = idb.open('restaurants-db', 1, db => {
  //create data store if it does not exist
  if (!db.objectStoreNames.contains('restaurants')){
    db.createObjectStore('restaurants', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('reviews')){
    db.createObjectStore('reviews', {keyPath: 'id'});
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
    //console.log('allSavedItems: ' + allSavedItems);
    return allSavedItems;
  });
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
