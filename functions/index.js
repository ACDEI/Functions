const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
var GeoFirestore = require('geofirestore').GeoFirestore;
const admin = require("firebase-admin");
const { ref } = require("firebase-functions/lib/providers/database");

//npm i --save cross-fetch 
const fetch = require('cross-fetch').fetch;
admin.initializeApp();

const app = express();

app.use(cors({origin:true}));

const db =  admin.firestore();

// Create a GeoFirestore reference
const geoFirestore = new GeoFirestore(db);

// archivos Json
var jsonMonuments = null;
var jsonAirQuality = null;
var dateMonuments = null;
var dateAirQuality = null; 



//-------------------------------------------------------------------------USER Functions--------------------------------------------------------------------------

//get users
app.get("/users/", async (req, res) => {
    try {

        const snapshot = await admin.firestore().collection("users").get();
        const users = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            users.push({ id, ...data });
        });
        res.status(200).send(users);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});


//query search user for name
app.get('/users/nombre/:nombre',async(req,res)=>{
    try{

        //const snapshot = await admin.firestore().collection('users').where("fullName","==",req.params.nombre);
        const snapshot = await admin.firestore().collection('users');
        const users = [];
        let product = await snapshot.get().then((snapshot) =>{
            snapshot.forEach((doc) => {
            const name = doc.data().fullName; 
            if(name.toLowerCase().includes(req.params.nombre.toLowerCase())){
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            }
          
        });
        });
        
        res.status(200).send(users);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

//query search user for email in order ascendent 
app.get('/users/email/:email',async(req,res)=>{
    try{

        //const snapshot = await admin.firestore().collection('users').where("fullName","==",req.params.nombre);
        const snapshot = await admin.firestore().collection('users').orderBy("email","asc");
        const users = [];
        let product = await snapshot.get().then((snapshot) =>{
            snapshot.forEach((doc) => {
            const email = doc.data().email; 
            if(email.toLowerCase().includes(req.params.email.toLowerCase())){
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            }
        });
        });
       
        res.status(200).send(users);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})


//query get publications trough complete email of user 
app.get('/users/publications/:email',async(req,res)=>{
    try{
       
         //obtengo snap de email
        const snapshot = await admin.firestore().collection('users').where("email","==",req.params.email);
        const publications = [];
        const users = [];
        // obtengo array de usuarios con ese email
        await snapshot.get().then((snap)=>{

            snap.forEach((doc) => {
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            });

        })
        // obtengo el primer resultado solo debería arrojar uno ya que el uid esta realacionado con el email
        const usuario = users[0];
        

        //busco las publicaciones de ese usuario // no encuentra publicaciones por uid
        const resultado = await admin.firestore().collection('publications').where("uid","==",usuario.id);
        await resultado.get().then((snap)=>{
            snap.forEach((doc)=>{
                const id = doc.id;
                const data = doc.data();
                publications.push({id, ...data});
            })
        })
    
        res.status(200).send(publications);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});





//get users from ..to 
app.get('/users/from/:from/:to',async(req,res)=>{
    try{

        const from = Number(req.params.from);
        const to = Number(req.params.to);
        var result = to-from; 

    if(result >= 0){
        result++;
        const snapshot = await admin.firestore().collection("users").offset(from).limit(result).get();
        const users = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            users.push({ id, ...data });
        });
        res.status(200).send(users);

    }else{
        res.status(400).send("From higher than to");
    }

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

//get count Users
app.get("/users/count/", async(req,res)=> {
    try{

        await db.collection("users").get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})


//get user id 
app.get('/users/:id',async(req,res)=>{
    try{
    
        const snapshot = admin.firestore().collection('users').doc(req.params.id);
        let product = await snapshot.get();
        let user = product.data();
        res.status(200).send((user));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

//post users 
app.post("/users/", async (req, res) => {

    try{

     
        const busqueda = await admin.firestore().collection("users").doc(req.body.uid);       
        const resultado = (await busqueda.get()).data();
     
         if(resultado == null){
            const user = req.body;
            await admin.firestore().collection('users').doc(user.uid).set({
                email: user.email,
                fullName: user.fullName,
                isAdmin:user.isAdmin,
                nickName: user.nickName,
                photoURL: user.photoURL,
                uid: user.uid 
            })
            res.status(200).send("Usuario insertado enn BBDD");
         }else {
            res.status(400).send("Usuario ID ya se encuentra en BBDD");
         }

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//put users
app.put("/users/:id", async (req, res) => {

    try{
        
        const user = await admin.firestore().collection('users').doc(req.params.id);
        await user.update({
            email: req.body.email,
            fullName: req.body.fullName,
            isAdmin: req.body.isAdmin,
            nickName: req.body.nickName,
            photoURL: req.body.photoURL
        })
        res.status(200).send("User update");

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//delete users 
app.delete("/users/:id", async (req, res) => {

    try{

        var result = await admin.firestore().collection('users').doc(req.params.id);
        var usuario = (await result.get()).data(); 
        
    if(usuario != null){
 
        var publications = admin.firestore().collection('publications').where("uid","==",req.params.id);

        (await publications.get()).forEach((publi)=>{

            admin.firestore().collection('publications').doc(publi.id).delete();

        })

        await result.delete();
    
        res.status(200).send("User delete");
    }else {
        res.status(400).send("This id not exists");
    }

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

///QUERY OPERATIONS 

/// query for user 



//-------------------------------------------------------------------------Publication Functions--------------------------------------------------------------------------

//POST publication
app.post("/publications/", async (req, res) => {
    try{

        var result = await admin.firestore().collection('users').doc(req.body.uid);
        var usuario = (await result.get()).data(); 

        if(usuario != null && req.body.lat != null && req.body.lng != null){

            const lat =  Number(req.body.lat); 
            const lng = Number(req.body.lng);

            await geoFirestore.collection('publications').doc(req.body.pid).set({
                date: req.body.date ,
                graffiter: req.body.graffiter,
                nLikes: req.body.nLikes,
                photoURL: req.body.photoURL,
                pid: req.body.pid,
                state: req.body.state,
                themes: req.body.themes,
                title: req.body.title,
                uid:req.body.uid,
                coordinates:new admin.firestore.GeoPoint(lat,lng)
            })



            res.status(200).send("Post created in DB");
        }else{
            res.status(400).send("Missing fields (uid, lat, lng)");
        }

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//Put publication
app.put("/publications/:id", async (req, res) => {
    try{

        const publication = geoFirestore.collection('publications').doc(req.params.id);
        
        if(req.body.lat != null && req.body.lng != null){
             const coord = new admin.firestore.GeoPoint(req.body.lat, req.body.lng)
             req.body["coordinates"] = coord;
             delete req.body.lat
             delete req.body.lng
        }



        await publication.update(req.body); 

        res.status(200).send("Publication Updated.");

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//Get from tematicas
app.get('/publications/tematicas/:id',async(req,res)=>{
    try{

        //const snapshot = await admin.firestore().collection('publications').where("themes","==",req.params.id);
        const snapshot = await admin.firestore().collection('publications').where("themes","array-contains",req.params.id);
        const publications = [];
        await snapshot.get().then((snap)=>{

            snap.forEach((doc)=>{
                const id = doc.id;
                const data = doc.data();
                publications.push({id, ...data});
            })

        });
        
        res.status(200).send(publications);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
    
    
})


//Get all tematicas
app.get('/themes/',async(req,res)=>{
    try{

        //const snapshot = await admin.firestore().collection('publications').where("themes","==",req.params.id);
        const snapshot = await admin.firestore().collection('themes');
        const themes = [];
        await snapshot.get().then((snap)=>{

            snap.forEach((doc)=>{
                const id = doc.id;
                const data = doc.data();
                themes.push({id, ...data});
            })

        });
        
        res.status(200).send(themes);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
    
    
})


//Get Count
app.get("/publications/count", async (req, res) => {
    try{

            await db.collection("publications").get().then(snap => {
                res.status(200).send({length: snap.size});
            });
    
        
    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});



//get users from ..to 
app.get('/publications/from/:from/:to',async(req,res)=>{
    try{

        const from = Number(req.params.from);
        const to = Number(req.params.to);
        var result = to-from; 

    if(result >= 0){
        result++;
        const snapshot = await admin.firestore().collection("publications").offset(from).limit(result).get();
        const publications = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            publications.push({ id, ...data });
        });
        res.status(200).send(publications);

    }else{
        res.status(400).send("From higher than to");
    }

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})




//get list of publications
app.get("/publications/", async (req, res) => {
    try {

        const snapshot = await admin.firestore().collection("publications").get();
        const pub = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            pub.push({ id, ...data });
        });
        res.status(200).send(pub);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//Delete Publication
app.delete("/publications/:id", async (req, res) => {

    try{

        await admin.firestore().collection("publications").doc(req.params.id).delete();
        res.status(200).send("Publication Deleted");

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//get publicaciones por el nombre del autor
app.get("/publications/autor/:nombre", async (req, res) => {
    try{

        //const snapshot = await admin.firestore().collection('users').where("fullName","==",req.params.nombre);
        const snapshot = await admin.firestore().collection('publications').where("graffiter","==",req.params.nombre);
        const publications = [];
        await snapshot.get().then((snap)=>{

            snap.forEach((doc)=>{
                const id = doc.id;
                const data = doc.data();
                publications.push({id, ...data});
            })

        });
        
        res.status(200).send(publications);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});


//Query publicaciones cercanas a un punto
app.get("/near/:lat&:lng&:dist", async (req, res) => {
    const lat = Number(req.params.lat);
    const lng = Number(req.params.lng);
    const dist = Number(req.params.dist);

    //date = new admin.firestore.Timestamp()

    const geoPhotos = geoFirestore.collection("publications").near({
        center: new admin.firestore.GeoPoint(lat,lng),
        radius: dist
    })

    list = [];

    (await geoPhotos.get()).docs.forEach( doc => {
        j = {...doc, ...doc.data()};
        list.push(j);
    });

    res.status(200).send(list);
});

//------------------------------------------------------DATOS ABIERTOS MÁLAGA----------------------------------------------------------------

var airQualityURL = "https://datosabiertos.malaga.eu/recursos/ambiente/calidadaire/calidadaire.json";

//Get size of the array
app.get("/openData/airQuality/size", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      
      await refreshAirQuality();
      res.status(200).send({"size": jsonAirQuality.length});
  
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Get all the data
app.get("/openData/airQuality/", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

      await refreshAirQuality();
      res.status(200).send(jsonAirQuality);
  
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Devuelve los datos de la zona en la que estas
app.get("/openData/airQuality/in/:lat&:lng", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

      await refreshAirQuality();
      const lat = Number(req.params.lat);
      const lng = Number(req.params.lng);
      var cont = 0; 
      var encontrado = false; 
      var item = null; 
      while(!encontrado && cont < jsonAirQuality.length){
        item = jsonAirQuality[cont];

        if(between(item.zone[0]._longitude,item.zone[1]._longitude,lng) && between(item.zone[0]._latitude,item.zone[1]._latitude,lat)){
            encontrado = true; 
        }

        cont++;
      }

      if(encontrado){
        res.status(200).send(item);
      }else{
        res.status(400).send("ZONE NOT FOUND");
      }
            
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Devuelve las zonas dependiendo de la calidad de CO
app.get("/openData/airQuality/dataCO/:calidad", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

      await refreshAirQuality();
      const resultado = []

      jsonAirQuality.forEach(item => {
        if(item.co_level == req.params.calidad){
            resultado.push(item);
        }
      });

      if(resultado.length == 0){
        res.status(400).send("No se ha encontrado ninguno");
      }else{
        res.status(200).send(resultado);
      }

    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

var monumentosURL = "https://datosabiertos.malaga.eu/recursos/urbanismoEInfraestructura/equipamientos/da_cultura_ocio_monumentos-4326.geojson";


//Get list of landmarks
app.get("/openData/landmarks", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
        
        await refreshMonuments();
        res.status(200).send(jsonMonuments);

    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})







function diferenciaFecha(d1,d2){

const diffTime = Math.abs(d2 - d1);
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
return diffDays; 

}

//Size of list of landmarks
app.get("/openData/landmarks/size", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

        await refreshMonuments();
        res.status(200).send({"size":jsonMonuments.length});
 
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Get data from name of one landmark
app.get("/openData/landmarks/dataName/:nombre", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

      await refreshMonuments();
      var cont = 0; 
      var encontrado = false; 
      var item = null; 
      while(!encontrado && cont < jsonMonuments.length){
        item = jsonMonuments[cont];

        if(item.name == req.params.nombre){
            encontrado = true;  
        }

        cont++;
      }

      if(encontrado){
        res.status(200).send(item);
      }else{
        res.status(400).send(JSON.stringify("LANDMARK NOT FOUND"));
      }


      
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Get data from id of one landmark
app.get("/openData/landmarks/data/:id", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      
      await refreshMonuments();
      var cont = 0; 
      var encontrado = false; 
      var item = null; 
      while(!encontrado && cont < jsonMonuments.length){
        item = jsonMonuments[cont];

        if(item.id == req.params.id){
            encontrado = true;  
        }

        cont++;
      }

      if(encontrado){
        res.status(200).send(item);
      }else{
        res.status(400).send(JSON.stringify("LANDMARK NOT FOUND"));
      }
            
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Get landmark near a coordinate
app.get("/openData/landmarks/near/:lat&:lng&:dist", async(req,res)=>{
      
    console.log("Fetching data...");

    try{

        await refreshMonuments();

        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);
        const dist = Number(req.params.dist);

        var resultado = [];

      jsonMonuments.forEach(item => {
        const coords = item.coordinates;
        const distancia = measure(Number(coords._latitude),Number(coords._longitude),lat,lng);

        if(distancia <= dist){
            resultado.push(item);
        }

      });

      res.status(200).send(resultado);
            
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})


var weatherURL = "http://api.openweathermap.org/data/2.5/weather?q=M%C3%A1laga&appid=f999cf50cb6f6117a41d2d625c6ba902"
//WEATHER API
app.get("/openWeatherMap/weather", async(req,res)=>{

    console.log("Fetching data...");

    try{

        await getJSON(weatherURL).then(data => {
            res.status(200).send(data);
        });


    }catch(error){

            console.log(error);
            res.status(500).send(error);
    
    }    


});


function between(n1, n2, pos){
    let nMenor = n1>n2 ? n2:n1, nMayor = n1>n2 ? n1:n2;

    return nMenor <= pos && nMayor >= pos;
}

function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}



const getJSON = async url => {
    try {
        const response = await fetch(url);
        if(!response.ok){ // check if response worked (no 404 errors etc...)
            throw new Error(response.statusText);
        }
        const data = await response.json(); // get JSON from the response
        return data; // returns a promise, which resolves to this data value
    } catch(error) {
      return error;
    }
  }

  async function refreshMonuments(){

    if(jsonMonuments == null || dateMonuments == null || diferenciaFecha(dateMonuments, new Date()) > 30){
            jsonMonuments = []; 
            dateMonuments = new Date();
            await getJSON(monumentosURL).then(data => {
                data.features.forEach(element => {

                    let coordinates = new admin.firestore.GeoPoint( element.geometry.coordinates[1], element.geometry.coordinates[0]);
                    let id = element.properties.ID; 
                    let nombre = element.properties.NOMBRE; 
                    jsonMonuments.push({"id": id, "name":nombre, "coordinates": coordinates});
                  
                });

            });
    }
}



async function refreshAirQuality(){

    if(jsonAirQuality == null || dateAirQuality == null || diferenciaFecha(dateAirQuality, new Date()) > 30){
            jsonAirQuality = []; 
            dateAirQuality = new Date();
            await getJSON(airQualityURL).then(data => {
                data.features.forEach(element => {

                    let zone =  [
                        new admin.firestore.GeoPoint( element.geometry.coordinates[0][0][1],
                             element.geometry.coordinates[0][0][0]),
                             new admin.firestore.GeoPoint(element.geometry.coordinates[0][2][1],
                             element.geometry.coordinates[0][2][0])];

                    let co_level = element.properties.co_level; 
                    let pm1_level = element.properties.pm1_level; 
                    let no2_level = element.properties.no2_level; 
                    jsonAirQuality.push({"co_level": co_level, "zone": zone , "pm1_level":pm1_level, "no2_level":no2_level});
                  
                });

            });
    }
}

//-------------------------------------------------------------------------EXPORT--------------------------------------------------------------------------

exports.APIRest = functions.https.onRequest(app);
