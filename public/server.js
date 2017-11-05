const mongo = require('mongodb').MongoClient;

var app = require('express')();
var server = require('http').Server(app);
var client = require('socket.io')(server);

server.listen(4000);

var multer  = require('multer');
var path = require('path');


app.get('/', function (req,res) {
res.send('MEAN Stack by Erick');
});

app.use(express.static('public'));


mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }
    console.log('MongoDB connected...');

app.get('/database', function (req, res) {
    if (err) {
       res.send('Sorry unable to connect to MongoDB Error:', err);
    } else {
        var collection = db.collection('chats');

        collection.find({}).toArray(function(err, listchat) {
            res.send(JSON.stringify(listchat, null, 2));
        });
    }
       
});

var storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, 'uploads');
  },
  filename: function (request, file, callback) {
    console.log(file);
    callback(null, file.originalname)
  }
});
var upload = multer({storage: storage}).single('photo');
app.post('/upload', function(request, response) {
  upload(request, response, function(err) {
  if(err) {
    console.log('Error Occured');
    return;
  }
  console.log(request.file);
       // Handle sendimage events
        socket.on('sendimage', function(data){
            let type = 'image';
            let name = data.name;
            let text = 'null';
            let image = request.file.originalname;
            let quick_replies = 'null';

            // Check for name and message
            if(name == '' || image == ''){
                // Send error status
                sendStatus('something wrong');
            } else {
                // Insert message
                chat.insert({type: type, name: name, text: text, image: image, quick_replies: quick_replies}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

  })
});

   client.on('connection', function(socket){
        let chat = db.collection('chats');

        
        sendStatus = function(s){
            socket.emit('status', s);
        }


        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let type = 'text';
            let name = data.name;
            let text = data.text;
            let image = 'null';
            let quick_replies = 'null';

            // Check for name and message
            if(name == '' || text == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({type: type, name: name, text: text, image: image, quick_replies: quick_replies}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });

   });


   

});

