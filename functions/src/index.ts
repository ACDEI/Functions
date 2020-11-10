import * as functions from 'firebase-functions';
import * as express from 'express';
//import * as cors from 'cors';

import * as admin from 'firebase-admin';
admin.initializeApp();

const app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });



//GET
//get usuarios
app.get("/users/", async (req, res) => {
    try {

        const snapshot = await admin.firestore().collection("users").get();
        const users:any = [];
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
app.get('/id/:id',async(req,res)=>{
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

//get user from ..to 



//get count Users
app.get("/countUsers", async(req,res)=> {
    try{

        const snapshot = await admin.firestore().collection("users").get();
        res.status(200).send(JSON.stringify(snapshot.size));

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
})





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



exports.APIRest = functions.https.onRequest(app);
