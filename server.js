const mongoose = require('mongoose');
const Document = require('./models/Document');
const express = require('express');
require('dotenv').config();
const PORT = process.env.PORT || '3001';
const USER_NAME = process.env.USER_NAME;
const PASS = process.env.PASS;
const app = express();
const server = require('http').createServer(app);

app.listen(PORT);

app.get('/', (req, res) => {
  res.send("I'm working");
});
mongoose.connect(
  `mongodb+srv://${USER_NAME}:${PASS}@cluster0.y29is.mongodb.net/Cluster0?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }
);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const defaultValue = '';

io.on('connection', (socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document', document.data);

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-doc', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const findOrCreateDocument = async (id) => {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
};
