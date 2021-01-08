const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
var GeoFirestore = require('geofirestore').GeoFirestore;
const admin = require("firebase-admin");
const { ref } = require("firebase-functions/lib/providers/database");
var latinize = require('latinize'); //Quitar Tildes : npm i latinize
var Twitter = require('twitter');

var cliente = new Twitter({
    consumer_key: 'Dgm9BLUenJRRG1ybL0HZXv0KP',
    consumer_secret: 'JpfwdMSyCACBJMXGjF5KcbnSvmuv9HwBQyF2NyU0On08tOaZfG',
    access_token_key: '',
    access_token_secret: ''
  });

//npm i --save cross-fetch 
const fetch = require('cross-fetch').fetch;
admin.initializeApp();

const app = express();
app.use(cors({origin:true}));

const db =  admin.firestore();
const geoFirestore = new GeoFirestore(db);  //Create a GeoFirestore reference

// JSON Files DatosAbiertos
var jsonMonuments = null;
var jsonAirQuality = null;
var dateMonuments = null;
var dateAirQuality = null; 

// Flickr Necessary Information
var Busboy = require('busboy');
var Flickr = require('flickr-sdk');
var token_secret = "";
var oauthToken = "";
var oauthVerifier="";
var token = "";
var tokenSecret = "";
var idFoto = "";
const Readable = require('readable-stream');

//Twitter API

// Variables de Colecciones Principales

var col_users = 'users';          //Coleccion Users
var users = '/users/';            //URL Users

var col_pubs = 'publications';    //Coleccion Publicaciones
var pubs = '/publications/';      //URL Publicaciones

var col_comments = 'comments';    //Coleccion Comentarios
var comments = '/comments/';      //URL Comentarios

var themes = '/themes/';          //Coleccion Themes
var col_themes = 'themes';        //URL Themes

//////////////////////////
// FUNCIONES DE USUARIO //
//////////////////////////

/*
 JSON:
    > uid           > isAdmin
    > email         > photoURL
    > fullName      > nickName
 SUB-COLECCIONES:
    > followed      > followers     > likes
     * uid           * uid           * pid
     * nick          * nick          * title
     * image         * image         * uploader : uid
                                     * uploader : nick 
                                     * image
*/

//Coleccion Base
// GET - READ
app.get(users, async (req, res) => {    //All Users (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).get();
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

app.get(users + "count", async(req,res)=> { //Users Number
   
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await db.collection(col_users).get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + ":uid", async (req, res) => {    //User By UID (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).doc(req.params.uid).get();
        var id = snapshot.id;
        var data = snapshot.data();
        res.status(200).send({ id, ...data });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + "email/:email", async (req, res) => {    //User By Email (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).orderBy('email', 'asc').get();
        const users = [];
        const email = latinize(req.params.email.trim().toLowerCase());
        snapshot.forEach((doc) => {
            console.log(doc.data());
            var emailD = latinize(doc.data().email.toLowerCase());
            if(emailD === email){
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            }
        });
        res.status(200).send(users);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + "admin/:admin", async (req, res) => {    //All (no) Admin Users (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).get();
        const users = [];

        var adminN = Number(req.params.admin);
        if(adminN == 1) adminN = true;
        else adminN = false;

        snapshot.forEach((doc) => {
            if(adminN === doc.data().isAdmin){
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            }
        });
        res.status(200).send(users);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + 'range/:from/:to',async(req,res)=>{  //Users Into a Range
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const from = Number(req.params.from);
        const to = Number(req.params.to);
        var result = to-from; 

        if(result >= 0){
            result++;
            const snapshot = await admin.firestore().collection(col_users).offset(from).limit(result).get();
            const users = [];
            snapshot.forEach((doc) => {
                const id = doc.id;
                const data = doc.data();
                users.push({ id, ...data });
            });
            res.status(200).send(users);

        } else res.status(400).send({message : "From higher than to"});

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + 'name/:name', async(req, res) => {  //Users By Name (Part)

    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const search = await admin.firestore().collection(col_users).get();
        const result = [];
        const name = latinize(req.params.name);
        search.forEach(doc => {
            var nameD = latinize(doc.data().fullName);
            if(nameD.toLowerCase().includes(name.toLowerCase())){
                const id = doc.data().id;
                const data = doc.data();
                result.push({id, ...data});
            }
        });
        res.status(200).send(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

//Innecesaria
app.get(users + "pubs/:email", async (req, res) => {    //User Publications By Email
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).where('email', '==', req.params.uid).get();
        const users = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            users.push({ id, ...data });
        });
        

        const usuario = users[0];

        //Busco Publicaciones por Usuario
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

// PUT - UPDATE
app.put(users + ':uid', async(req, res) => {

    try{

        //Comprobar si usuario Autenticado
       await authenticationFirebase(req, res);

        const useruid = req.params.uid;
        const search = await admin.firestore().collection(col_users).doc(useruid);
        const exists = (await search.get()).data();

        if(exists != null) {
            const user = req.body;

            /*
                ACTUALIZAR LIKES DEL USUARIO
            */

            //Actualizo Los Likes Si Son a Fotos Suyas
            
            const users = await admin.firestore().collection(col_users).get();
            var colUsers = [];
            users.forEach(uid => {
                colUsers.push(uid.id);
            });

            //var userQueDaLike = [];
            for(let uid of colUsers) {
                var likesPerUser = await admin.firestore().collection(col_users).doc(uid).collection(col_likes);
                likesPerUser.where('upl_uid', '==', useruid)
                    .get()
                    .then( snapshot => {
                        if(snapshot.size > 0) {
                            snapshot.forEach(item => {
                                likesPerUser.doc(item.id).update({
                                    upl_nick: user.nickName
                                });
                            })
                        }
                    })
            }

            //Cojo Todos Los Likes del User -> Para sus Likes
            const userLikes = await admin.firestore().collection(col_users).doc(useruid).collection(col_likes).get();
            const usrL = [];
            userLikes.forEach(doc => {
                var pid = doc.data();   //Id de Pub que tiene Like
                usrL.push(pid);
            });

            //Actualizo Sus Likes en Las Publicaciones
            for( const pidd of usrL) {
                await admin.firestore().collection(col_pubs).doc(pidd.pid).collection(col_likes).doc(useruid).update({
                    nick : user.nickName,
                    image : user.photoURL
                });
            }

            /*
                ACTUALIZAR SEGUIDORES DEL USUARIO
            */
            //Cojo Todos Los Followers del User -> User es SEGUIDO por ellos
            const userFollowers = await admin.firestore().collection(col_users).doc(useruid).collection(col_followers).get();
            const usrFw = [];
            userFollowers.forEach(doc => {
                var uidFw = doc.data();   //Id de Usr que le Sigue
                usrFw.push(uidFw);
            });

            //Actualizo al usuario de sus Seguidos
            for(const uidFw of usrFw) {
                await admin.firestore().collection(col_users).doc(uidFw.uid).collection(col_followed).doc(useruid).update({
                    nick: user.nickName,
                    image: user.photoURL
                });
            }

            /*
                ACTUALIZAR SEGUIDOS DEL USUARIO
            */
            //Cojo Todos Los Followed del User -> User es SEGUIDOR de ellos
            const userFollowed = await admin.firestore().collection(col_users).doc(useruid).collection(col_followed).get();
            const usrFd = [];
            userFollowed.forEach(doc => {
                var uidFd = doc.data();   //Id de Usr que le Sigue
                usrFd.push(uidFd);
            });

            //Actualizo al usuario de sus Seguidores
            for(const uidFd of usrFd) {
                console.log(uidFd);
                await admin.firestore().collection(col_users).doc(uidFd.uid).collection(col_followers).doc(useruid).update({
                    nick: user.nickName,
                    image: user.photoURL
                });
            }

            /*
                ACTUALIZAR COMMENTS DEL USUARIO
            */
            //Cojo Todos Los Comments del User
            const userComments = await admin.firestore().collection(col_comments).where('uid', '==', useruid).get();
            var usrCm = [];
            userComments.forEach(doc => {
                var cid = doc.data();   //Id de Usr que le Sigue
                usrCm.push(cid);
            });
            for(const cid of usrCm) {
                await admin.firestore().collection(col_comments).doc(cid.cid).update({
                    nick: user.nickName,
                    image: user.photoURL
                });
            }

            /*
                ACTUALIZAR USER
            */
            await admin.firestore().collection(col_users).doc(useruid.toString()).update({
                fullName: user.fullName,
                nickName: user.nickName,
                photoURL: user.photoURL
            })
            res.status(200).send({message: "User Updated In BD"});
        } else res.status(400).send({message: "User ID not exists in BD"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
app.post(users, async(req, res) => {

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const search = await admin.firestore().collection(col_users).doc(req.body.uid.toString());
        const exists = (await search.get()).data();

        if(exists == null) {
            const user = req.body;
            await admin.firestore().collection(col_users).doc(user.uid.toString()).set({
                uid: user.uid,
                email: user.email,
                fullName: user.fullName,
                isAdmin: user.isAdmin,
                nickName: user.nickName,
                photoURL: user.photoURL,
                nVisitados : 0
            });

            //Agregar a la Autentication -> EN PRUEBAS : HABRIA QUE RETOCAR BASTANTE EL PUT
            //await admin.auth().createUser({email : user.email, password : 'password123'});

            res.status(200).send({message: "User Inserted In BD"});
        } else res.status(400).send({message: "User ID already exists in BD"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
//Al borrar un usuario: 
//  * Borra de los demas usuarios los likes en sus publicaciones
//  * Borra sus publicaciones
//  * Se le borra de los seguidores de sus seguidos
//  * Se le borra de los seguidos de sus seguidores
app.delete(users + ":uid", async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uid = req.params.uid.toString();

        //Compruebo que Existe el Usuario
        const userToDelete = (await admin.firestore().collection(col_users).doc(uid).get()).data();
        var required = false;
        if( userToDelete != null) required = true;


        if(required){

            /*
                BORRAR LIKES DEL USUARIO
            */

             //Borro Los Likes Si Son a Fotos Suyas
             const users = await admin.firestore().collection(col_users).get();
             var colUsers = [];
             users.forEach(uid => {
                 colUsers.push(uid.id);
             });

             //var userQueDaLike = [];
             for(let uid of colUsers) {
                 var likesPerUser = await admin.firestore().collection(col_users).doc(uid).collection(col_likes);
                 likesPerUser.where('upl_uid', '==', useruid)
                     .get()
                     .then( snapshot => {
                         if(snapshot.size > 0) {
                             snapshot.forEach(item => {
                                 likesPerUser.doc(item.id).delete();
                             })
                         }
                     })
             }

            //Cojo Todos Los Likes del User -> Para sus Likes
            const userLikes = await admin.firestore().collection(col_users).doc(uid).collection(col_likes).get();
            const usrL = [];
            userLikes.forEach(doc => {
                var pid = doc.data().pid;   //Id de Pub que tiene Like
                usrL.push(pid);
            });

            //Borro al usuario de sus Likes
            for(const pid of usrL) {
                //Borrar Coleccion de Likes -> Eliminar Todos Sus Documentos
                await admin.firestore().collection(col_users).doc(uid).collection(col_likes).doc(pid).delete();
                //Borrar Like de Usuario de la Publicacion
                await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uid).delete();
            }

            /*
                BORRAR SEGUIDORES DEL USUARIO
            */
            //Cojo Todos Los Followers del User -> User es SEGUIDO por ellos
            const userFollowers = await admin.firestore().collection(col_users).doc(uid).collection(col_followers).get();
            const usrFw = [];
            userFollowers.forEach(doc => {
                var uidFw = doc.data().uid;   //Id de Usr que le Sigue
                usrFw.push(uidFw);
            });

            //Borro al usuario de sus Seguidos
            for(const uidFw of usrFw) {
                //Borrar Coleccion de Followed -> Eliminar Todos Sus Documentos
                await admin.firestore().collection(col_users).doc(uid).collection(col_followers).doc(uidFw).delete();
                //Borrar Usuario de Seguidores de B
                await admin.firestore().collection(col_users).doc(uidFw).collection(col_followed).doc(uid).delete();
            }

            /*
                BORRAR SEGUIDOS DEL USUARIO
            */
            //Cojo Todos Los Followed del User -> User es SEGUIDOR de ellos
            const userFollowed = await admin.firestore().collection(col_users).doc(uid).collection(col_followed).get();
            const usrFd = [];
            userFollowed.forEach(doc => {
                var uidFd = doc.data().uid;   //Id de Usr que le Sigue
                usrFd.push(uidFd);
            });

            //Borro al usuario de sus Seguidores
            for(const uidFd of usrFd) {
                //Borrar Coleccion de Followed -> Eliminar Todos Sus Documentos
                await admin.firestore().collection(col_users).doc(uid).collection(col_followed).doc(uidFd).delete();
                //Borrar Usuario de Seguidores de B
                await admin.firestore().collection(col_users).doc(uidFd).collection(col_followers).doc(uid).delete();
            }

            /*
                BORRAR COMMENTS DEL USUARIO
            */
            //Cojo Todos Los Comments del User
            const userComments = await admin.firestore().collection(col_comments);
                userComments.where('uid', '==', uid).get()
                .then( snapshot => {
                if(snapshot.size > 0) {
                    snapshot.forEach(item => {
                        userComments.doc(item.id).delete();
                    })
                }
            })

            /*
                BORRAR VISITADOS DEL USUARIO
            */
            //Cojo Todos Los Comments del User
            const userVisitados = await admin.firestore().collection(col_users).doc(uid).collection('visitados');
                userVisitados.get()
                .then( snapshot => {
                if(snapshot.size > 0) {
                    snapshot.forEach(item => {
                        userVisitados.doc(item.id).delete();
                    })
                }
            })

            /*
                BORRAR PUBLICACIONES DEL USUARIO
            */
           //Cojo Todos Las Pubs del User
           const userPubs = await admin.firestore().collection(col_pubs).where('uid', '==', uid).get();
           const upA = [];
           userPubs.forEach(doc => {
               var pid = doc.data().pid;   //pId de Pub
               upA.push(pid);
           });

           for(const pid of upA) {
               await admin.firestore().collection(col_pubs).doc(pid).delete();
           }

            /*
                BORRAR USER
            */
            await admin.firestore().collection(col_users).doc(uid).delete();

            //Eliminar de la Autentication
            await admin.auth().deleteUser(uid);

            res.status(200).send({message : "User Deleted"});

        } else res.status(500).send({message: 'User not Exists'});

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

//Sub-Colecciones

var followers = '/followers/';
var col_followers = 'followers';

var followed = '/followed/';
var col_followed = 'followed';

var likes = '/likes/';
var col_likes = 'likes';

/////////////////////////////
// FUNCIONES DE SEGUIDORES //
/////////////////////////////

// GET - READ
app.get(followers + ':uid', async(req,res) => {   //User's Followers By UID
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).doc(req.params.uid).collection(col_followers).get();
        const followers = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            followers.push({ id, ...data });
        });
        res.status(200).send(followers);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(followers + "count/:uid", async(req,res)=> { //Followers Number
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uid = req.params.uid.toString();
        await db.collection(col_users).doc(uid).collection(col_followers).get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(followers + ':uid&:uidF', async(req, res) => {    //Update a Follower from a User UID and Follower UID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const uidF = req.params.uidF.toString();    // UID del Seguidor
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(uidF);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el Seguidor o el Usuario
            const user = req.body;  //Datos del Seguidor Actualizados
            if(uidF === user.uid.toString()){    //UID Follower no Cambia
                await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(uidF).update({
                    nick: user.nick,
                    image: user.image
                })
                res.status(200).send({message: "Follower Updated In BD"});
            } else res.status(400).send({message: "Follower ID cannot be change"});
        } else res.status(400).send({message: "User not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
//Al anadir a un Usuario A un seguidor B: 
//  * Se suma a B a los seguidores de A
//  * Se suma a A a los seguidos de B
app.post(followers + ':uid', async(req, res) => {    //Add a Follower to User By UID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const uidF = req.body.uid.toString();
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(uidF);
        const exists = (await search.get()).data();

        if(exists == null) {    //Existe el Seguidor y el Usuario
            const user = req.body;  //Datos del Seguidor

            //Suma B como Seguidor de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(user.uid.toString()).set({
                uid: user.uid,
                nick: user.nick,
                image: user.image
            })

            //Suma A como Seguido de B
            const userA = (await admin.firestore().collection(col_users).doc(uidP).get()).data();
            await admin.firestore().collection(col_users).doc(user.uid.toString()).collection(col_followed).doc(uidP).set({
                uid: userA.uid,
                nick: userA.nickName,
                image: userA.photoURL
            })

            res.status(200).send({message: "Follower Posted In BD"});
        } else res.status(400).send({message: "Follower Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
//Al borrar un Usuario A un seguidor B: 
//  * Se borra a B de los seguidores de A
//  * Se borra a A de los seguidos de B
app.delete(followers + ":uid&:uidF", async (req, res) => {

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // A
        const uidF = req.params.uidF.toString();    // B

        var result = await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(uidF);
        var exists = (await result.get()).data(); 
        
        if(exists != null){    // B es seguidor de A
    
            //Borrar B de Seguidores de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_followers).doc(exists.uid).delete();

            //Borrar A de Seguidos de B
            await admin.firestore().collection(col_users).doc(exists.uid).collection(col_followed).doc(uidP).delete();
        
            res.status(200).send({message: 'Leave Follow'});
        } else res.status(400).send({message: 'Not Valid UIDs'});

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

///////////////////////////
// FUNCIONES DE SEGUIDOS //
///////////////////////////

// GET - READ
app.get(followed + ':uid', async(req,res) => {      //User's Followed By UID
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).doc(req.params.uid).collection(col_followed).get();
        const followed = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            followed.push({ id, ...data });
        });
        res.status(200).send(followed);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(followed + "count/:uid", async(req,res)=> { //Followed Number
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uid = req.params.uid.toString();
        await db.collection(col_users).doc(uid).collection(col_followed).get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(followed + ':uid&:uidF', async(req, res) => {    //Update a Followed from a User UID and Followed UID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const uidF = req.params.uidF.toString();    // UID del Seguido
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(uidF);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el Seguido o el Usuario
            const user = req.body;  //Datos del Seguido Actualizados
            if(uidF === user.uid.toString()){    //UID Follower no Cambia
                await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(uidF).update({
                    nick: user.nick,
                    image: user.image
                })
                res.status(200).send({message: "Followed Updated In BD"});
            } else res.status(400).send({message: "Followed ID cannot be change"});
        } else res.status(400).send({message: "User not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
//Al anadir a un Usuario A un seguidor B: 
//  * Se suma a B a los seguidos de A
//  * Se suma a A a los seguidores de B
app.post(followed + ':uid', async(req, res) => {    //Add a Follower to User By UID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const uidF = req.body.uid.toString();
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(uidF);
        const exists = (await search.get()).data();

        if(exists == null) {    //Existe el Seguidor y el Usuario
            const user = req.body;  //Datos del Seguidor

            //Suma B como Seguido de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(user.uid.toString()).set({
                uid: user.uid,
                nick: user.nick,
                image: user.image
            })

            //Suma A como seguidor de B
            const userA = (await admin.firestore().collection(col_users).doc(uidP).get()).data();
            await admin.firestore().collection(col_users).doc(user.uid.toString()).collection(col_followers).doc(uidP).set({
                uid: userA.uid,
                nick: userA.nickName,
                image: userA.photoURL
            })

            res.status(200).send({message: "Follower Posted In BD"});
        } else res.status(400).send({message: "Follower Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
//Al borrar un Usuario A un seguido B: 
//  * Se borra a B de los seguidos de A
//  * Se borra a A de los seguidores de B
app.delete(followed + ":uid&:uidF", async (req, res) => {

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // A
        const uidF = req.params.uidF.toString();    // B

        var result = await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(uidF);
        var exists = (await result.get()).data(); 
        
        if(exists != null){    // A sigue a B
    
            //Borrar A de Seguidores de B
            await admin.firestore().collection(col_users).doc(exists.uid).collection(col_followers).doc(uidP).delete();

            //Borrar B de Seguidos de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_followed).doc(exists.uid).delete();
        
            res.status(200).send({message: 'Leave Followed'});
        } else res.status(400).send({message: 'Not Valid UIDs'});

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

////////////////////////
// FUNCIONES DE LIKES //
////////////////////////

// GET - READ
app.get(users + 'likes/:uid', async(req,res) => {      //User's Likes By UID
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_users).doc(req.params.uid).collection(col_likes).get();
        const likes = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            likes.push({ id, ...data });
        });
        res.status(200).send(likes);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(users + 'likescount/:uid', async(req,res)=> { //Likes User Number
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uid = req.params.uid.toString();
        await db.collection(col_users).doc(uid).collection(col_likes).get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(users + 'likes/:uid&:pid', async(req, res) => {    //Update a Liked Photo from a User UID and Photo PID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const pid = req.params.pid.toString();      // PID de Publicacion Likeada
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el Seguido o la Publicacion

            const liked = req.body;  //Datos de la Publicacion Actualzada
            if(pid === liked.pid.toString()){    //PID no cambia
                await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid).update({
                    title: liked.title,
                    upl_nick: liked.upl_nick
                })
                res.status(200).send({message: "Liked Updated In BD"});
            } else res.status(400).send({message: "Liked ID cannot be change"});
        } else res.status(400).send({message: "Liked or User not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
//Al darle un Usuario A like a una imagen B: 
//  * Se suma B a los likes de A
//  * Se suma A a los likes de B
app.post(users + 'likes/:uid', async(req, res) => {    //Add a Liked Photo to User By UID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const pid = req.body.pid.toString();       //PID de la imagen
        const search = await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid);
        const exists = (await search.get()).data();

        if(exists == null) {    //Existe el Usuario y la Imagen
            const liked = req.body;  //Datos de la Imagen

            //Suma B como Like de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid).set({
                pid: liked.pid,
                title: liked.title,
                upl_uid: liked.upl_uid,
                upl_nick: liked.upl_nick,
                image: liked.image
            })

            //Suma A como Like de B
            const userA = (await admin.firestore().collection(col_users).doc(uidP).get()).data();
            await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP).set({
                uid: userA.uid,
                nick: userA.nickName,
                image: userA.photoURL
            })

            res.status(200).send({message: "Liked Added in Both Ways"});
        } else res.status(400).send({message: "Liked Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
//Al borrar de un Usuario A un Like B: 
//  * Se borra a B de los likes de A
//  * Se borra a A de los likes de B
app.delete(users + 'likes/:uid&:pid', async (req, res) => {

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // A
        const pid = req.params.pid.toString();    // B

        var result = await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid);
        var exists = (await result.get()).data(); 
        
        if(exists != null){    // B es Like de A
    
            //Borrar B de Likes de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid).delete();

            //Borrar A de Seguidos de B
            await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP).delete();
        
            res.status(200).send({message: 'Like Quited'});
        } else res.status(400).send({message: 'Not Valid IDs'});

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

////////////////////////////////
// FUNCIONES DE PUBLICACIONES //
////////////////////////////////

/*
 JSON:
    > pid           > title         > themes
    > uid           > graffiter     > date
    > state         > photoURL      > coordinates + g
 SUB-COLECCIONES:
    > likes
     * uid   
     * nick     
     * image         
*/

// GET - READ
app.get(pubs, async (req, res) => {    //All Publications Order By Date (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_pubs).orderBy('date', 'desc').get();
        const publications = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            publications.push({ id, ...data });
        });
        res.status(200).send(publications);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(pubs + "count", async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await db.collection(col_pubs).get().then(snap => {
            res.status(200).send({length: snap.size});
        });
        
    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(pubs + ":pid", async (req, res) => {    //Pubs By PID (without sub-collections)
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_pubs).doc(req.params.pid).get();
        //const publications = [];
        const id = snapshot.id;
        const data = snapshot.data();
        //publications.push({ id, ...data });
        res.status(200).send({ id, ...data });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(pubs + 'title/:title', async(req, res) => {  //Pubs By Title (Part)

    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const search = await admin.firestore().collection(col_pubs).get();
        const result = [];
        const title = latinize(req.params.title);
        search.forEach(doc => {
            var titleD = latinize(doc.data().title);
            if(titleD.toLowerCase().includes(title.toLowerCase())){
                const id = doc.data().id;
                const data = doc.data();
                result.push({id, ...data});
            }
        });
        res.status(200).send(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get(pubs + 'range/:from/:to',async(req,res)=>{
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const from = Number(req.params.from);
        const to = Number(req.params.to);
        var result = to-from; 

        if(result >= 0){
            result++;
            const snapshot = await admin.firestore().collection(col_pubs).offset(from).limit(result).get();
            const publications = [];
            snapshot.forEach((doc) => {
                const id = doc.id;
                const data = doc.data();
                publications.push({ id, ...data });
            });
            res.status(200).send(publications);

        } else res.status(400).send("From higher than to");

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(pubs + 'user/:uid', async(req, res) => {  //Pubs By User UID

    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uid = req.params.uid.toString();
        const search = await admin.firestore().collection(col_pubs).where('uid', '==', uid).get();
        const result = [];
        search.forEach(doc => {
            const id = doc.data().id;
            const data = doc.data();
            result.push({id, ...data});
        });
        res.status(200).send(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get(pubs + 'graffiter/:graffiter', async(req, res) => {  //Pubs By Graffiter (Part)

    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const search = await admin.firestore().collection(col_pubs).get();
        const result = [];
        const graffiter = latinize(req.params.graffiter);
        search.forEach(doc => {
            var grafD = latinize(doc.data().graffiter);
            if(grafD.toLowerCase().includes(graffiter.toLowerCase())){
                const id = doc.data().id;
                const data = doc.data();
                result.push({id, ...data});
            }
        });
        res.status(200).send(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get(pubs + 'themes/:id',async(req,res) => {   //Get Pubs From Theme (Only one)
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_pubs).where("themes","array-contains",req.params.id);
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

// PUT - UPDATE
//Al actualizar una pub A: 
//  * Se actualiza la pub A
//  * Se actualiza la pub A de todos los usuarios que dieron MG
app.put(pubs + ":pid", async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const pid = req.params.pid.toString();
        const publication = geoFirestore.collection(col_pubs).doc(pid);

        var titlePrev = (await publication.get()).data().title.toLowerCase();
        var titleNew = req.body.title.toLowerCase();
        
        //Actualizar Pub A
        if(req.body.lat != null && req.body.lng != null){
             const coord = new admin.firestore.GeoPoint(req.body.lat, req.body.lng);
             req.body["coordinates"] = coord;
             delete req.body.lat
             delete req.body.lng
        }
        if(req.body.themes != null) {
            var ts = [];
            req.body.themes.forEach(t => {
                ts.push(t.name);
            })
            delete req.body.themes;
            req.body['themes'] = ts;
        }
        await publication.update(req.body);

        var requireUpdate = false;  //Solo si el titulo es diferente
        if(titlePrev !== titleNew) requireUpdate = true;

        if(requireUpdate){

            //Coger Todos Los Likes de Todos los Usuarios
            const userLikes = await admin.firestore().collection(col_pubs).doc(pid).collection(likes).get();
            const users = [];
            userLikes.forEach(doc => {
                var uid = doc.data().uid;   //Id de usuario que tiene Like
                users.push(uid);
            });

            //Actualizar Likes de User
            for(const uid of users){
                const origData = await admin.firestore().collection(col_users).doc(uid).collection(col_likes).doc(pid);
                var dataLike = (await origData.get()).data();
                origData.update({
                    title: req.body.title,
                    upl_nick: dataLike.upl_nick,
                });
            }

            /*
                ACTUALIZAR VISITADOS DEL USUARIO
            */
            const userVisitados = await admin.firestore().collection(col_users);
                userVisitados.get()
                .then( snapshot => {
                if(snapshot.size > 0) {
                    snapshot.forEach(item => {
                        const pubVisited = userVisitados.doc(item.id).collection('visitados');
                        pubVisited.where('pid', '==', pid).get().then( pubSnap => {
                            if(pubSnap.size > 0) {
                                pubSnap.forEach(p => {
                                    pubVisited.doc(p.id).update({ title : req.body.title });
                                })
                            }
                        })
                    })
                }
            })
        }

        res.status(200).send({message : "Publication Updated"});

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// POST - WRITE
app.post(pubs, async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        var result = await admin.firestore().collection(col_users).doc(req.body.uid);
        var existsU = (await result.get()).data(); 

        if(existsU != null && req.body.lat != null && req.body.lng != null){

            const lat =  Number(req.body.lat); 
            const lng = Number(req.body.lng);

            var ts = [];
            req.body.themes.forEach(t => {
                ts.push(t.name);
            })

            await geoFirestore.collection(col_pubs).doc(req.body.pid).set({
                date: new Date() ,
                graffiter: req.body.graffiter,
                photoURL: req.body.photoURL,
                pid: req.body.pid,
                state: req.body.state,
                themes: ts,
                title: req.body.title,
                uid:req.body.uid,
                coordinates:new admin.firestore.GeoPoint(lat,lng)
            })

            res.status(200).send({message: "Post created in DB"});
        } else res.status(400).send({message: "Missing fields (uid, lat, lng)"});

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// DELETE
//Al borrar una pub A: 
//  * Se borra la pub A
//  * Se borra la pub A de todos los usuarios que dieron Like
//  * Se borran los Comentarios de la Publicacion
app.delete(pubs + ":pid", async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const pid = req.params.pid.toString();
        const pubData = (await admin.firestore().collection(col_pubs).doc(pid).get()).data();
        var required = false;
        if(pubData != null) required = true;

        if(required) {
            //BORRAR LIKE DE USER
            //Coger Todos Los Likes de Todos los Usuarios
            const userLikes = await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).get();
            const users = [];
            userLikes.forEach(doc => {
                var uid = doc.data().uid;   //Id de usuario que tiene Like
                users.push(uid);
            });

            for (const uid of users) {
                //Borrar Coleccion de Likes -> Eliminar Todos Sus Documentos
                await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uid).delete();
                //Borrar Like de Usuario
                await admin.firestore().collection(col_users).doc(uid).collection(col_likes).doc(pid).delete();
            }

            //Borrar Comentarios de la Imagen
            const commentsPub = await admin.firestore().collection(col_comments).where('pid', '==', pid).get();
            var cpA = [];
            commentsPub.forEach(cp => {
                var cid = cp.data().cid;
                cpA.push(cid);
            });

            for( const c of cpA) {
                await admin.firestore().collection(col_comments).doc(c).delete();
            }

            //Borrar Publicacion
            await admin.firestore().collection(col_pubs).doc(pid).delete();
            res.status(200).send({message: "Publication Deleted."});
        } else res.status(500).send({message: "Publication Not Exists"});

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

///////////////////////////////
// FUNCIONES DE LIKES (PUBS) //
///////////////////////////////

/*
    SUB-COLECCIONES:
        > likes
            * uid   
            * nick     
            * image    
 */

// GET - READ
app.get(pubs + 'likes/:pid', async(req,res) => {      //Pub's Likes By PID
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_pubs).doc(req.params.pid).collection(col_likes).get();
        const likes = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            likes.push({ id, ...data });
        });
        res.status(200).send(likes);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(pubs + "likescount/:pid", async(req,res)=> { //Likes Pub Number
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const pid = req.params.pid.toString();
        await db.collection(col_pubs).doc(pid).collection(col_likes).get().then(snap => {
            res.status(200).send({length: snap.size});
        });

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(pubs + 'likes/:uid&:pid', async(req, res) => {    //Update a User that Liked Photo given User UID and Photo PID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // UID del Usuario
        const pid = req.params.pid.toString();      // PID de Publicacion
        const search = await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el Usuario o la Publicacion
            const liked = req.body;  //Datos del Usuario Actualizado
            if(uidP === liked.uid.toString()){    //UID no cambia
                await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP).update({
                    nick: liked.nick,
                    image: liked.image
                })
                res.status(200).send({message: "Liked Updated In BD"});
            } else res.status(400).send({message: "Liked ID cannot be change"});
        } else res.status(400).send({message: "Liked or User not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
//Al darle una imagen A es dada like por un usuario B:
//  * Se suma A a los likes de B
//  * Se suma B a los likes de A
app.post(pubs + 'likes/:pid', async(req, res) => {    //Add a User to Pub By PID

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.body.uid.toString();     // UID del Usuario
        const pid = req.params.pid.toString();       //PID de la imagen
        const search = await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP);
        const exists = (await search.get()).data();

        if(exists == null) {    //Existe el Usuario y la Imagen

            //Suma B como da Like a A
            const liked = req.body;  //Datos deL Usuario
            await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP).set({
                uid: liked.uid,
                nick: liked.nickName,
                image: liked.photoURL
            })

            //Suma B como Like de A
            const pubB = (await admin.firestore().collection(col_pubs).doc(pid).get()).data();
            const userA = (await admin.firestore().collection(col_users).doc(pubB.uid).get()).data();
            await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid).set({
                pid: pubB.pid,
                title: pubB.title,
                upl_uid: pubB.uid,
                upl_nick: userA.nickName,
                image: pubB.photoURL
            })

            res.status(200).send({message: "Liked Added in Both Ways"});
        } else res.status(400).send({message: "Liked Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
//Al borrar de un Usuario A un Like B: 
//  * Se borra a B de los likes de A
//  * Se borra a A de los likes de B
app.delete(pubs + "likes/:uid&:pid", async (req, res) => {

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const uidP = req.params.uid.toString();     // A
        const pid = req.params.pid.toString();    // B

        var result = await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP);
        var exists = (await result.get()).data(); 
        
        if(exists != null){    // B es Like de A
    
            //Borrar B de Likes de A
            await admin.firestore().collection(col_users).doc(uidP).collection(col_likes).doc(pid).delete();

            //Borrar A de Seguidos de B
            await admin.firestore().collection(col_pubs).doc(pid).collection(col_likes).doc(uidP).delete();
        
            res.status(200).send({message: 'Like Quited'});
        } else res.status(400).send({message: 'Not Valid IDs'});

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

//////////////////////////////
// FUNCIONES DE COMENTARIOS //
//////////////////////////////

/*
 JSON:
    > pid           > uid           > nick
    > timestamp     > text          > cid
*/

// GET - READ
app.get(comments, async (req, res) => {    //Comments
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_comments).orderBy('timestamp', 'desc').get();
        const comment = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            comment.push({ id, ...data });
        });
        res.status(200).send(comment);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(comments + ":cid", async (req, res) => {    //Comments Per User
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_comments).orderBy('timestamp', 'desc').get();
        const comment = [];
        snapshot.forEach((doc) => {
            if(req.params.cid.toString() == doc.id.toString()){
                const id = doc.id;
                const data = doc.data();
                comment.push({ id, ...data });
            }
        });
        res.status(200).send(comment);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(comments + "user/:uid", async (req, res) => {    //Comments Per User
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_comments).where('uid', '==', req.params.uid).orderBy('timestamp', 'desc').get();
        const comment = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            comment.push({ id, ...data });
        });
        res.status(200).send(comment);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(comments + "publication/:pid", async (req, res) => {    //Comments Per Publication
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_comments)
                    .where('pid', '==', req.params.pid).orderBy('timestamp', 'desc').get();
        const comment = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            comment.push({ id, ...data });
        });
        res.status(200).send(comment);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(comments + ':cid', async(req, res) => {    //Update A Comment

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const cid = req.params.cid.toString();     // CID del Comment
        const search = await admin.firestore().collection(col_comments).doc(cid);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el comment
            const comment = req.body;  //Datos del comment Actualzada
            await admin.firestore().collection(col_comments).doc(cid).update({
                nick: comment.nick
            })
            res.status(200).send({message: "Comment Updated In BD"});
        } else res.status(400).send({message: "Comment not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
app.post(comments, async(req, res) => {    //Post A Comment

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const cid = req.body.cid.toString();     // CID del Comment
        const search = await admin.firestore().collection(col_comments).doc(cid);
        const exists = (await search.get()).data();

        if(exists == null) {    //No Existe el comment
            const comment = req.body;  //Datos del comment
            await admin.firestore().collection(col_comments).doc(cid).set({
                cid: comment.cid,
                pid: comment.pid,
                uid: comment.uid,
                text: comment.text,
                nick: comment.nick,
                image: comment.image,
                timestamp: new Date()
            })
            res.status(200).send({message: "Comment Posted In BD"});
        } else res.status(400).send({message: "Comment Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
app.delete(comments + ':cid', async(req, res) => {    //Delete A Comment

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const cid = req.params.cid.toString();     // CID del Comment
        const search = await admin.firestore().collection(col_comments).doc(cid);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el comment
            await admin.firestore().collection(col_comments).doc(cid).delete();
            res.status(200).send({message: "Comment Updated In BD"});
        } else res.status(400).send({message: "Comment not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

////////////////////////////
// FUNCIONES DE TEMATICAS //
////////////////////////////

/*
 JSON:
    > name (= tid)
*/

// GET - READ
app.get(themes, async (req, res) => {    //Themes
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_themes).get();
        const theme = [];
        snapshot.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            theme.push({ id, ...data });
        });
        res.status(200).send(theme);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

app.get(themes + ":tid", async (req, res) => {    //Themes Per TID-Name
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const snapshot = await admin.firestore().collection(col_themes).get();
        const theme = [];
        snapshot.forEach((doc) => {
            if(req.params.tid.toString() == doc.id.toString()){
                const id = doc.id;
                const data = doc.data();
                theme.push({ id, ...data });
            }
        });
        res.status(200).send(theme);

    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
});

// PUT - UPDATE
app.put(themes + ':tid', async(req, res) => {    //Update A Theme

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const tid = req.params.tid.toString();     // CID del theme
        const search = await admin.firestore().collection(col_themes).doc(tid);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe el theme
            const theme = req.body;  //Datos del theme
            //Borro Anterior
            await admin.firestore().collection(col_themes).doc(tid).delete();

            //Sumo Nueva
            await admin.firestore().collection(col_themes).doc(theme.name).set({
                name: theme.name
            })

            //Reemplazo en Todas las Publicaciones Donde Este
            const pubsThemes = await admin.firestore().collection(col_pubs).where("themes","array-contains", tid).get();
            await pubsThemes.forEach((doc) => {
                var ts = doc.data().themes;
                ts = ts.filter(t => t !== tid);
                ts.push(theme.name);

                var pub = doc.data();
                admin.firestore().collection(col_pubs).doc(doc.id).set({
                    date: pub.date,
                    graffiter: pub.graffiter,
                    photoURL: pub.photoURL,
                    pid: pub.pid,
                    state: pub.state,
                    themes: ts,
                    title: pub.title,
                    uid: pub.uid,
                    coordinates: pub.coordinates
                });

            });

            res.status(200).send({message: "Theme Updated In BD"});
        } else res.status(400).send({message: "Theme not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// POST - WRITE
app.post(themes, async(req, res) => {    //Post A Theme

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const tid = req.body.name.toString();     // CID del Comment
        const search = await admin.firestore().collection(col_themes).doc(tid);
        const exists = (await search.get()).data();

        if(exists == null) {    //No Existe el comment
            await admin.firestore().collection(col_themes).doc(tid).set({
                name: tid
            })
            res.status(200).send({message: "Theme Added"});
        } else res.status(400).send({message: "Theme Already Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

// DELETE
app.delete(themes + ':tid', async(req, res) => {    //Delete A Theme

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        const tid = req.params.tid.toString();     // TID de Theme
        const search = await admin.firestore().collection(col_themes).doc(tid);
        const exists = (await search.get()).data();

        if(exists != null) {    //No Existe la Theme

            //Elimino de Todas las Publicaciones Donde Este
            const pubsThemes = await admin.firestore().collection(col_pubs).where("themes","array-contains", tid).get();
            await pubsThemes.forEach((doc) => {
                var ts = doc.data().themes;
                ts = ts.filter(t => t !== tid);

                var pub = doc.data();
                admin.firestore().collection(col_pubs).doc(doc.id).set({
                    date: pub.date,
                    graffiter: pub.graffiter,
                    photoURL: pub.photoURL,
                    pid: pub.pid,
                    state: pub.state,
                    themes: ts,
                    title: pub.title,
                    uid: pub.uid,
                    coordinates: pub.coordinates
                });

            });

            //Elimino la Theme
            await admin.firestore().collection(col_themes).doc(tid).delete();

            res.status(200).send({message: "Theme Deleted From BD"});
        } else res.status(400).send({message: "Theme not Exists"});

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }

});

/////////////////////////////
//  DATOS ABIERTOS MALAGA  //
// FUNCIONES DE MONUMENTOS //
/////////////////////////////

var monumentosURL = "https://datosabiertos.malaga.eu/recursos/urbanismoEInfraestructura/equipamientos/da_cultura_ocio_monumentos-4326.geojson";

app.get("/openData/landmarks", async(req,res) => {  //Todos los Monumentos

    try {  

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshMonuments();
        res.status(200).send(jsonMonuments);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/landmarks/size", async(req,res) => {     //Cantidad de Datos - Count

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshMonuments();
        res.status(200).send({size : jsonMonuments.length});
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/landmarks/dataName/:nombre", async(req,res) => {     //Datos de Monumento por Nombre      

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshMonuments();
        var cont = 0; 
        var encontrado = false; 
        var item = null; 
        while(!encontrado && cont < jsonMonuments.length){
            item = jsonMonuments[cont];

            if(item.name == req.params.nombre) encontrado = true;

            cont++;
        }

        if(encontrado) res.status(200).send(item);
        else res.status(400).send(JSON.stringify({message : "LANDMARK NOT FOUND"}));

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/landmarks/data/:id", async(req,res) => {     //Datos de Monumento por ID
      
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshMonuments();
        var cont = 0; 
        var encontrado = false; 
        var item = null; 
        while(!encontrado && cont < jsonMonuments.length) {
            item = jsonMonuments[cont];
            if(item.id == req.params.id) encontrado = true;  
            cont++;
        }

        if(encontrado) res.status(200).send(item);
        else res.status(400).send(JSON.stringify({message : "LANDMARK NOT FOUND"}));
                
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/landmarks/near/:lat&:lng&:dist", async(req,res) => {     //Monumentos cerca de cada Coordenada
      
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshMonuments();
        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);
        const dist = Number(req.params.dist);
        var resultado = [];

        jsonMonuments.forEach(item => {
            const coords = item.coordinates;
            const distancia = measure(Number(coords._latitude), Number(coords._longitude), lat, lng); 
            if(distancia <= dist) {
                var r = { ...item, distancia };
                resultado.push(r);
            }
        });
        res.status(200).send(resultado);      
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

////////////////////////////////
///  DATOS ABIERTOS MALAGA   ///
/// FUNCIONES DE AIR QUALITY ///
////////////////////////////////

var airQualityURL = "https://datosabiertos.malaga.eu/recursos/ambiente/calidadaire/calidadaire.json";

app.get("/openData/airQuality/size", async(req,res) => {    //Cantidad de Datos - Count
      
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshAirQuality();
        res.status(200).send({"size": jsonAirQuality.length});
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/airQuality/", async(req,res) => {    //Todos los Datos 
    
    try {

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshAirQuality();
        res.status(200).send(jsonAirQuality);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

app.get("/openData/airQuality/in/:lat&:lng", async(req,res) => {    //Zonas Segun la Zona Lat y Long

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);
        
        await refreshAirQuality();
        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);
        var cont = 0; 
        var encontrado = false; 
        var item = null; 
        while(!encontrado && cont < jsonAirQuality.length) {
            item = jsonAirQuality[cont];

            if(between(item.zone[0]._longitude,item.zone[1]._longitude,lng) 
                && between(item.zone[0]._latitude,item.zone[1]._latitude,lat)) encontrado = true; 

            cont++;
        }

        if(encontrado) res.status(200).send(item);
        else res.status(400).send({message : "ZONE NOT FOUND"});
            
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get("/openData/airQuality/dataCO/:calidad", async(req,res) => { //Zonas Segun Calidad de CO

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await refreshAirQuality();
        const resultado = []
        jsonAirQuality.forEach(item => {
            if(item.co_level == req.params.calidad) resultado.push(item);
        });

        if(resultado.length == 0) res.status(400).send({message : "No se ha encontrado ninguno"});
        else res.status(200).send(resultado);

    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }

});

////////////////////////////////
/// FUNCIONES DE ACCUWEATHER ///
////////////////////////////////

var weatherURL = "http://api.openweathermap.org/data/2.5/weather?q=M%C3%A1laga&appid=f999cf50cb6f6117a41d2d625c6ba902";

app.get("/openWeatherMap/weather", async(req,res)=>{

    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        await getJSON(weatherURL).then(data => {
            res.status(200).send(data);
        });
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }    

});

//////////////////////////
// FUNCIONES AUXILIARES //
//////////////////////////

function diferenciaFecha(d1,d2){
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays; 
} 
    
function between(n1, n2, pos){
    let nMenor = n1>n2 ? n2:n1, nMayor = n1>n2 ? n1:n2;
    return nMenor <= pos && nMayor >= pos;
}

function measure(lat1, lon1, lat2, lon2){   // generally used geo measurement function
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

async function authenticationFirebase(req,res){

    const idToken = req.get("Authorization").split('Bearer ')[1];
    //console.log("Autorization: " + idToken);

    await admin.auth().verifyIdToken(idToken).then((decodedToken) => {
        const uid = decodedToken.uid;
        //console.log('Usr autorizado Firebase: ' + uid);
    }).catch((error) => {
        //console.log("Usr NO autorizado");
        res.status(500).send(error);
    });
}

///////////////////////////////
// FUNCIONES CON COORDENADAS //
///////////////////////////////

app.get("/near/:lat&:lng&:dist", async (req, res) => {  //Publicaciones Cercanas a un Punto
    
    //Comprobar si usuario Autenticado
    await authenticationFirebase(req, res);

    const lat = Number(req.params.lat);
    const lng = Number(req.params.lng);
    const dist = Number(req.params.dist);

    //date = new admin.firestore.Timestamp()

    const geoPhotos = geoFirestore.collection(col_pubs).near({
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


//////////////////////
// FUNCIONES FLICKR //
//////////////////////

//CONECTAR PARA OBTENER URL AUTHORIZE
app.get("/flickr/conectar", async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        await authenticationFirebase(req, res);

        //Configurar claves de FlickrAPI
        process.env.FLICKR_CONSUMER_KEY = "9cab71d9d05b7c91e06ae4da65b6ba8d";
        process.env.FLICKR_CONSUMER_SECRET = "c590b7868c106336";
        process.env.FLICKR_API_KEY = "9cab71d9d05b7c91e06ae4da65b6ba8d";
        var token = "";
    
        //Plugin para obtener Request-Token
        var oauth = new Flickr.OAuth(
          process.env.FLICKR_CONSUMER_KEY,
          process.env.FLICKR_CONSUMER_SECRET
        );

        //Obtener los token y configurar redirección
        let self = this;
        //console.log(req.query.url);
        await oauth.request(req.query.url).then(async function (res) {
            //console.log('Oauth_Token: ' + res.body.oauth_token + '; Oauth_Token_Secret: ' + res.body..oauth_token_secret);
            self.token = res.body.oauth_token;
            self.token_secret = res.body.oauth_token_secret; 
            //console.log("-----------------------> 1 " + self.token_secret);
        }).catch(function (err) {
            //console.error('bonk', err);
        });


        process.env.FLICKR_OAUTH_TOKEN = this.token; 
        process.env.FLICKR_OAUTH_TOKEN_SECRET = this.token_secret; 
        //console.log("-----------------------------------> 2 " + this.token_secret);

        //OAuth Url: Si el usuario cancela le devuelve a Flickr
        var url = oauth.authorizeUrl(this.token);
        url = url + "&perms=write&perms=delete";
        //console.log(url);
        res.status(200).send({"url":url, "token_secret": this.token_secret}); 

    } catch(error) {
        //console.log(error);
        res.status(500).send(error);
    }
});


// SUBIR FOTO A FLICKR
app.post("/flickr/upload" ,async (req, res) => {
    
    try{

        //Comprobar si usuario Autenticado
        //await authenticationFirebase(req, res);

        const objArray = []
        const bb = new Busboy({ headers: req.headers });
        let fileData = {}
        let formData = {}
        const f = [];
        
        await new Promise((resolve, reject) => {
          bb.on('file', function (fieldname, file, filename, encoding, mimetype) {
            //console.log('File [%s]: filename=%j; encoding=%j; mimetype=%j', fieldname, filename, encoding, mimetype);
            fileData.file = filename
            fileData.fileName = filename
            fileData.encoding = encoding
            fileData.mimetype = mimetype
            fileData.data = {} 

            file.on('data', data => {
                fileData.data[fieldname] = data.length;
                f.push(data);
            })

            file.on("end", () => {
                const fileStream = createReadableStream(f);
                req.body[fieldname] = fileStream;
            });

            }).on('field', (fieldname, val) => {
                try { formData[fieldname] = JSON.parse(val)
                } catch (err) { formData[fieldname] = val }
            })
            .on("finish", resolve)
            .on('error', err => { throw err })
            bb.end(req.body)
        })
        
        this.oauthToken = formData.oauth_token;
        this.oauthVerifier = formData.oauth_verifier; 

        process.env.FLICKR_CONSUMER_KEY = "9cab71d9d05b7c91e06ae4da65b6ba8d";
        process.env.FLICKR_CONSUMER_SECRET = "c590b7868c106336";

        var oauth = new Flickr.OAuth(
            process.env.FLICKR_CONSUMER_KEY,
            process.env.FLICKR_CONSUMER_SECRET
        );
        
        let self = this; 
        await oauth.verify(this.oauthToken, this.oauthVerifier, formData.token_secret).then(function (res) {
            //console.log('OAuth_Token: ', res.body.oauth_token + '; OAuth_Token_Secret: ', res.body.oauth_token_secret);
            self.token = res.body.oauth_token;
            self.tokenSecret = res.body.oauth_token_secret;
        }).catch(function (err) {
            //console.log('bonk', err);
        });

        process.env.FLICKR_OAUTH_TOKEN = this.token ;
        process.env.FLICKR_OAUTH_TOKEN_SECRET = this.tokenSecret ;

        var flickr = Flickr.OAuth.createPlugin(
            process.env.FLICKR_CONSUMER_KEY,
            process.env.FLICKR_CONSUMER_SECRET,
            process.env.FLICKR_OAUTH_TOKEN,
            process.env.FLICKR_OAUTH_TOKEN_SECRET
        );

        var upload = new Flickr.Upload(flickr, req.body.file , {
            title: formData.title
        });
    
        upload.then(async function (resultado) {
            //console.log('Body_Content: ', resultado.body.photoid._content);
            let result = await getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=9cab71d9d05b7c91e06ae4da65b6ba8d&photo_id="+ resultado.body.photoid._content + "&format=json&nojsoncallback=?");
            res.status(200).send(result);
        }).catch(function (err) {
            //console.error('bonk', err);
            res.status(500).send(err);
        });

    } catch(error) {
        //console.log(error);
        res.status(500).send(error);
    }
});

//TWITTER/////////////

app.get("/tweet/update" ,async (req, res) => {
    try{
        console.log("ENTRO CRACKS");
        
        
          cliente.post('statuses/update', {status: 'I Love Twitter'},  function(error, tweet, response) {
            if(error) throw error;
            console.log(tweet);  // Tweet body.
            console.log(response);  // Raw response object.
            res.status(200).send(tweet);
          });
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});



const createReadableStream = (buffer) => {
    const readableInstanceStream = new Readable({
        read() {
            for (const bytes of buffer) this.push(bytes);
            this.push(null);
        },
    });
    return readableInstanceStream.read();
};

/////////////
// EXPORTS //
/////////////

exports.MalagArtApiWeb = functions.https.onRequest(app);
