import * as functions from 'firebase-functions';
import * as express from 'express';
//import * as cors from 'cors';

import * as admin from 'firebase-admin';
admin.initializeApp();

let app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

app.get("/users/", async (req, res) => {
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

app.post("/users/", async (req, res) => {
    const user = req.body;
  
    await admin.firestore().collection("users").add(user);
  
    res.status(201).send();
});

exports.APIRest = functions.https.onRequest(app);
