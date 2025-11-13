import m from "mongoose";

const myURL = "mongodb+srv://nodestudent:studentnode@cluster0.qatsq.mongodb.net/mongodemo";

await m.connect(myURL, { useNewUrlParser: true, useUnifiedTopology: true });

const Finaltest = m.model('Finaltest', m.Schema({}, { strict: false }), 'finaltest');

const doc = await Finaltest.findOne();
console.log(doc.question);

await m.connection.close();
