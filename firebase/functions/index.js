const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Firestore = require("@google-cloud/firestore");
const fs = require("fs");
const { scan, parseText, search } = require("./helpers");

admin.initializeApp();

exports.addINS = functions
  .region("europe-west1")
  .firestore.document("/INS/additives/individual/{code}")
  .onCreate((snap, context) => {
    const newValue = snap.data();

    const additives = admin.firestore().doc(`/INS/additives`);
    additives.update({
      list: Firestore.FieldValue.arrayUnion({
        code: context.params.code,
        ...newValue,
      }),
    });

    if (newValue.categories) {
      const categories = admin.firestore().doc(`/INS/categories`);
      categories.update({
        list: Firestore.FieldValue.arrayUnion(...newValue.categories),
      });
    }

    return 1;
  });

exports.removeINS = functions
  .region("europe-west1")
  .firestore.document("/INS/additives/individual/{code}")
  .onDelete((snap, context) => {
    const oldValue = snap.data();

    const additives = admin.firestore().doc(`/INS/additives`);
    additives.update({
      list: Firestore.FieldValue.arrayRemove({
        code: context.params.code,
        ...oldValue,
      }),
    });

    return 1;
  });

exports.procesImage = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    // if image not in request return error
    if (!req.body.image) {
      res.status(400).send({ error: "No image in request body" });
      return;
    }

    var text = await scan(req.body.image);

    if (text == null) {
      res.status(500).send({ error: "Error scanning image" });
      return;
    }

    var parsedTest = await parseText(text);

    if (!parsedTest) {
      res.status(500).send({ error: "Error parsing text" });
      return;
    }

    var seperateByComma = parsedTest.split(",").map((item) => item.trim());

    if (seperateByComma.length < 1) {
      res.status(500).send({ error: "Error finding stuff" });
      return;
    }

    
    var db = admin.firestore();

    var data = await db
      .collection("INS")
      .doc("additives")
      .get()
      .then((doc) => {
        if (doc.exists) {
          return doc.data();
        } else {
          return null;
        }
      })
      .catch((error) => {
        console.log("Error getting document:", error);
      });

    const searchResult = search(seperateByComma, data.list);

    return res.status(200).send({ error: false, data: searchResult });

  });
