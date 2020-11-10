const functions = require("firebase-functions");
const express = require("express");
//const cors = require("cors");
var GeoFirestore = require('geofirestore').GeoFirestore;

const admin = require("firebase-admin");
admin.initializeApp();

const app = express();

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

/*
//query search user for name 
app.get('/users/aaaaaaa/:email',async(req,res)=>{
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
        res.status(200).sendusers;

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

*/
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

        const user = req.body;
        await admin.firestore().collection("users").add(user);
        res.status(200).send();

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

//Post publication
app.post("/publications/", async (req, res) => {
    const publication = req.body;

    const pub = {
        fotoUrl: publication.fotoUrl,
        coordinates: new admin.firestore.GeoPoint(publication.lat, publication.lng)
    }
    
    await geoFirestore.collection("publications").add(pub);

    res.status(201).send();
});

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

//-------------------------------------------------------------------------EXPORT--------------------------------------------------------------------------

exports.APIRest = functions.https.onRequest(app);
