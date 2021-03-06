const mongo = require('mongodb').MongoClient;

var app = require('express')();
var express = require('express');
var fs = require('fs');
var server = require('http').Server(app);
var client = require('socket.io')(server);

server.listen(4000);

var multer = require('multer');
var path = require('path');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/', function(req, res) {
    res.send('MEAN Stack by Erick');
});

app.use('/static', express.static('uploads'));
app.use('/view', express.static('view'));




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
            let quick_replies = data.quick_replies;
    

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

        socket.on('quickreplies', function(data) {
            // send quick replies
            let name = 'Automatic';
            let quick_replies = [
                                  {
                                    "content_type":"text",
                                    "title":"Do You Want This Item?",
                                    "image_url":"http://i.ebayimg.com/00/s/NTE2WDUxNg==/z/WxYAAOSwY45UUMHG/$_32.JPG",
                                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                                  }
                                ]
            
               chat.insert({
                    type: 'quickreplies',
                    name: name,
                    quick_replies: quick_replies
                }, function() {
                    client.emit('output', [{ type:'quickreplies', name: name, quick_replies: quick_replies }]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });

            
        });
		
		app.post('/upload', function(req, res) {
		var upload = multer({
			storage: multer.memoryStorage()
		}).single('photo')
		upload(req, res, function(err) {
			var buffer = req.file.buffer;
			var filename = req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
			fs.writeFile('uploads/' + filename, buffer, 'binary', function(err) {
					if (err) throw err
					//res.end(filename + 'File is uploaded');
					res.json({
						message: 'file uploaded',
						filename: filename
					 });
					
										let type = 'image';
										let name = req.body.username[0];
									
										let attachment =   {
                                                            "type":"image",
                                                            "payload": {
                                                                         "url": filename
                                                                         }
                                                            };

										let quick_replies = req.body.quick_replies;

										// Check for name and message
										if (name == '' || attachment == '') {
											// Send error status
											sendStatus('Please specify name and attachement');
										} else {
											// Insert message
											chat.insert({
												type: type,
												name: name,
												attachment: attachment,
												quick_replies: quick_replies
											}, function() {
												client.emit('output', [{ type:type, name: name, attachment: attachment }]);

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
