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

app.post("/publications/", async (req, res) => {
    const publication = req.body;

    const pub = {
        fotoUrl: publication.fotoUrl,
        coordinates: new admin.firestore.GeoPoint(publication.lat, publication.lng)
    }
    
    await geoFirestore.collection("publications").add(pub);

    res.status(201).send();
});

//GET
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
        res.status(200).send(JSON.stringify(users));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//get user id 
app.get('/users/:id',async(req,res)=>{
    try{
        
        const snapshot = await admin.firestore().collection('users').doc(req.params.id);
        let product = await snapshot.get();
        let user = product.data();
        res.status(200).send(JSON.stringify(user));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

//get users from ..to 
app.get('/users/:from/:to',async(req,res)=>{
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
        res.status(200).send(JSON.stringify(users));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})


//get count Users
app.get("/users/count", async(req,res)=> {
    try{

        const snapshot = await admin.firestore().collection("users").get();
        res.status(200).send(JSON.stringify(snapshot.size));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})


///POST 

//post users 
app.post("/users/", async (req, res) => {

    try{

        const user = req.body;
        await admin.firestore().collection("users").add(user);
        res.status(201).send();

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});


//PUT 

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


//DELETE 

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

//query search user for name --not working yet---
app.get('/users/nombre/:nombre',async(req,res)=>{
    try{

        const snapshot = await admin.firestore().collection('users').where("fullName","==",req.params.nombre);
        let product = await snapshot.get();
        console.log(product);
        res.status(200).send(JSON.stringify(product));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})

exports.APIRest = functions.https.onRequest(app);
