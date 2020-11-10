import * as functions from 'firebase-functions';
import * as express from 'express';
//import * as cors from 'cors';
//import * as firebase from 'firebase/app';
import * as geofirestore from 'geofirestore';

import * as admin from 'firebase-admin';
admin.initializeApp();

const db = admin.firestore();
const GeoFirestore = geofirestore.initializeApp(db);
const app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

app.get("/users/", async (req, res) => {
    const snapshot = await db.collection("users").get();

    console.log(snapshot);

    const users:any = [];
    snapshot.forEach((doc) => {
        const id = doc.id;
        const data = doc.data();

        console.log(id, data);

        users.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(users));
});

app.post("/users/", async (req, res) => {
    const user = req.body;
  
    await db.collection("users").add(user);
  
    res.status(201).send();
});

app.get("/near/:lat&:lng&:dist", async (req, res) => {
    const lat:number = +req.params.lat;
    const lng:number = +req.params.lng;
    const dist:number = +req.params.dist;

    const geoPhotos = GeoFirestore.collection("fotos").near({
        center: new admin.firestore.GeoPoint(lat,lng),
        radius: dist
    })

    const geosnap = await geoPhotos.get();

    res.status(200).send(geosnap.docs);
});

exports.APIRest = functions.https.onRequest(app);
