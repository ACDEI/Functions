const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
var GeoFirestore = require('geofirestore').GeoFirestore;
const admin = require("firebase-admin");

//npm i --save cross-fetch 
const fetch = require('cross-fetch').fetch;
admin.initializeApp();

const app = express();

app.use(cors({origin:true}));

const db =  admin.firestore();

// Create a GeoFirestore reference
const geoFirestore = new GeoFirestore(db);

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
        console.log(product);
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
        console.log(product);
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
        console.log(usuario.id);//hasta aquí funciona bien 

        //busco las publicaciones de ese usuario // no encuentra publicaciones por uid
        const resultado = await admin.firestore().collection('publications').where("uid","==",usuario.id);
        await resultado.get().then((snap)=>{
            snap.forEach((doc)=>{
                const id = doc.id;
                const data = doc.data();
                publications.push({id, ...data});
            })
        })
        console.log(publications)
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
        const snapshot = await admin.firestore().collection("users").offset(from).limit(to).get();
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

        await admin.firestore().collection("users").doc(req.params.id).delete();
        res.status(200).send("User delete");

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
       
        const busqueda = await admin.firestore().collection('publications').doc(req.body.pid);       
        const resultado = (await busqueda.get()).data();
     
         if(resultado == null){
            const pub = {
                pid: req.body.pid,
                uid: req.body.uid,
                photoURL: req.body.photoURL,
                title: req.body.title,
                graffiter: req.body.graffiter,
                date: req.body.date,
                state: req.body.state,
                nLikes: req.body.nLikes,
                themes: req.body.themes,
                coordinates: new admin.firestore.GeoPoint(req.body.lat, req.body.lng)
            }
            await geoFirestore.collection("publications").doc(pub.pid).set(pub);
            res.status(200).send("Post created in DB");
         }else {
            res.status(400).send("PID Already Exists in DB");
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
        await publication.update({
            photoURL: req.body.photoURL,
            title: req.body.title,
            graffiter: req.body.graffiter,
            state: req.body.state,
            nLikes: req.body.nLikes,
            themes: req.body.themes,
            coordinates: new admin.firestore.GeoPoint(req.body.lat, req.body.lng)
        })

        res.status(201).send("Publication Updated.");

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//Get from tematicas
app.get('/publications/tematicas/:id',async(req,res)=>{
    try{

        //const snapshot = await admin.firestore().collection('users').where("fullName","==",req.params.nombre);
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


//Query publicaciones cercanas a un punto
app.get("/near/:lat&:lng&:dist", async (req, res) => {
    const lat = Number(req.params.lat);
    const lng = Number(req.params.lng);
    const dist = Number(req.params.dist);

    const geoPhotos = geoFirestore.collection("publications").near({
        center: new admin.firestore.GeoPoint(lat,lng),
        radius: dist
    })

    const geosnap = await geoPhotos.get();

    res.status(200).send(geosnap.docs);
});

//------------------------------------------------------DATOS ABIERTOS MÁLAGA----------------------------------------------------------------

//de momento solo muestra los datos , habría que hacer diferentes consultas 
app.get("/openData/airQuality", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      getJSON("https://datosabiertos.malaga.eu/recursos/ambiente/calidadaire/calidadaire.json").then(data => {
        console.log(data.features);
        res.status(200).send(data.features);
      });
  
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})


//Get list of landmarks
app.get("/openData/landmarks", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      getJSON("https://datosabiertos.malaga.eu/recursos/urbanismoEInfraestructura/equipamientos/da_cultura_ocio_monumentos-4326.geojson").then(data => {
        console.log(data);
        res.status(200).send(data);
      });
  
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Size of list of landmarks
app.get("/openData/landmarks/size", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      var data =await getJSON("https://datosabiertos.malaga.eu/recursos/urbanismoEInfraestructura/equipamientos/da_cultura_ocio_monumentos-4326.geojson");
      

     
      console.log(data.totalFeatures);
      var length = data.totalFeatures;
      res.status(200).send(JSON.stringify({"size": length}));
  
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})

//Get data from one landmark
app.get("/openData/landmarks/data/:nombre", async(req,res)=>{
      
    console.log("Fetching data...");

    try{
      const data =await getJSON("https://datosabiertos.malaga.eu/recursos/urbanismoEInfraestructura/equipamientos/da_cultura_ocio_monumentos-4326.geojson");
      
      const arr = data.features;
      console.log(data.features)

      arr.forEach(item => {
        console.log(item);
        if(item.properties.NOMBRE == req.params.nombre){
            res.status(200).send(JSON.stringify({"properties" : item.properties,"coordinates": item.geometry.coordinates}));
        }
      });
            
    }catch(error){

        console.log(error);
        res.status(500).send(error);

    }

})


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




//-------------------------------------------------------------------------EXPORT--------------------------------------------------------------------------

exports.APIRest = functions.https.onRequest(app);
