const mongo = require('mongodb').MongoClient;

var app = require('express')();
var express = require('express');
var fs = require('fs');
var server = require('http').Server(app);
var client = require('socket.io')(server);

server.listen(4000);

var multer = require('multer');
var path = require('path');


app.get('/', function(req, res) {
    res.send('MEAN Stack by Erick');
});

app.use('/static', express.static('uploads'));





mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
    if (err) {
        throw err;
    }
    console.log('MongoDB connected...');

    app.get('/database', function(req, res) {
        if (err) {
            res.send('Sorry unable to connect to MongoDB Error:', err);
        } else {
            var collection = db.collection('chats');

            collection.find({}).toArray(function(err, listchat) {
                res.send(JSON.stringify(listchat, null, 2));
            });
        }

    });
	
	

	
	client.on('connection', function(socket) {
        let chat = db.collection('chats');


        sendStatus = function(s) {
            socket.emit('status', s);
        }


        chat.find().limit(100).sort({
            _id: 1
        }).toArray(function(err, res) {
            if (err) {
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data) {
            let type = 'text';
            let name = data.name;
            let text = data.text;
            let image = 'null';
            let quick_replies = 'null';

            // Check for name and message
            if (name == '' || text == '') {
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({
                    type: type,
                    name: name,
                    text: text,
                    image: image,
                    quick_replies: quick_replies
                }, function() {
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
        socket.on('clear', function(data) {
            // Remove all chats from collection
            chat.remove({}, function() {
                // Emit cleared
                socket.emit('cleared');
            });
        });
		
		app.post('/upload', function(req, res) {
		var upload = multer({
			storage: multer.memoryStorage()
		}).single('photo')
		upload(req, res, function(err) {
			var buffer = req.file.buffer
			var filename = req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
			fs.writeFile('uploads/' + filename, buffer, 'binary', function(err) {
					if (err) throw err
					//res.end(filename + 'File is uploaded');
					res.json({
						message: 'file uploaded',
						filename: filename
					 });
					
										let type = 'image';
										let name = req.body.username;
										let text = 'null';
										let image = filename;
										let quick_replies = 'null';

										// Check for name and message
										if (name == '' || image == '') {
											// Send error status
											sendStatus('Please enter a name and message');
										} else {
											// Insert message
											chat.insert({
												type: type,
												name: name,
												text: text,
												image: image,
												quick_replies: quick_replies
											}, function() {
												client.emit('output', 'empty');

												// Send status object
												sendStatus({
													message: 'Message sent',
													clear: true
												});
											});
										}				       
					
					
					
				});
			
			});
					
		});
		
		
	
        
			

            
        

    });




});
