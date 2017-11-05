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

var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './uploads')
	},
	filename: function(req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
})


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

app.post('/api/file', function(req, res) {
	var upload = multer({
		storage: storage,
		fileFilter: function(req, file, callback) {
			var ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
				return callback(res.end('Only images are allowed'), null)
			}
			callback(null, true)
		}
	}).single('userFile');
	upload(req, res, function(err) {
		res.end('File is uploaded')
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
            let name = data.name;
            let text = data.text;
            let quick_replies = data.quick_replies;

            // Check for name and message
            if(name == '' || text == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, text: text}, function(){
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

