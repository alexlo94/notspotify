//require all the neccessary packages
var express = require('express');
var mongojs = require('mongojs');
var fs = require('fs');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var formidable = require('formidable');

var app = express();
app.use(express.static('static'));
app.use(urlencodedParser); 
app.set('view engine', 'ejs');

var db = "YOURMONGODBINFOHERE"
var path = 'static/music';
var currfiles = [];

//method to refresh the database by reading the file system and inserting any stray objects
function refreshdb(){
	//read the files currently in the directory and construct song objects with relevant info
	fs.readdir(path, function(err, items){
		//loop through read items
		for(var i = 0; i < items.length; i++){
			//create object to insert into collection
			var song = new Object();
			var songsplit = items[i].split(".");
			song.filename = items[i];
			song.path = path + "\/" + items[i];
			song.extension = songsplit[1];
			song.title = songsplit[0];

			db.notspotify.update(song, song, {upsert:true});
		}
	});
}


/*app.get('/', function(req, res){
	refreshdb();
	//get all the docs from the db
	db.notspotify.find({}, function(err, found){
		//case1: bad query
		if(err||!found){
			console.log("bad query");
		}
		//case2: no problemo
		else{
			found.forEach(function(song){
				console.log(song);
			});
		}
		res.render("home.ejs", {"songlist": found});
	});
});
*/

app.get('/data', function(req, res){
	refreshdb();
	db.notspotify.find({}, function(err, found){
		//case1: bad query
			if(err||!found){
				console.log("bad query");
			}
		//case2: no problemo
			else{
				found.forEach(function(song){
					console.log(song);
				});
			}
		res.send(found);
	});
});

app.get('/refresh', function(req, res){
	refreshdb();
	db.notspotify.find({}, function(err, found){
		//case1: bad query
		if(err||!found){
			console.log("bad query");
		}
		//case2: no problemo
		else{
			found.forEach(function(song){
				console.log(song);
			});
		}
		res.render("home.ejs", {"songlist": found});
	});
});

app.get('/submit', function(req, res){
	console.log("received submit request!");
	res.render("form.ejs");
});

app.post('/fileupload', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		var oldpath = files.filetoupload.path;
		var newpath = path + "/" + files.filetoupload.name;

		fs.rename(oldpath, newpath, function(err){
			if(err) throw err;
			res.write('file uploaded successfuly, go to home to see it');
			res.end();
		});
	});
});

app.post('/playsong', function(req,res){
	var name = req.body.songname;
	console.log(name);
	res.render("visualizer.ejs", {"songname": name});
});

app.listen(6969);
