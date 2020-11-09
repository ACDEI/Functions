import * as functions from 'firebase-functions';
import * as express from 'express';
//import * as cors from 'cors';
//var serviceAccount = require("src/serviceAccountKey.json");

import * as admin from 'firebase-admin';

/*
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://graffiti-9b570.firebaseio.com"
});
*/

admin.initializeApp();

let app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

app.get("/", async (req, res) => {
    const snapshot = await admin.firestore().collection("users").get();

    console.log(snapshot);

    let users:any = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();

        console.log(id, data);

        users.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(users));
});

app.post("/", async (req, res) => {
    const user = req.body;
  
    await admin.firestore().collection("users").add(user);
  
    res.status(201).send();
  });

exports.user = functions.https.onRequest(app);
