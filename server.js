var busboy = require("connect-busboy"),
	ejs = require("ejs"),
	express = require("express");
	fs = require("fs")

var app = express();
app.set("views", __dirname + "/");
app.engine(".html", ejs.__express);
app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/public"));
app.use(busboy());

app.put("/upload", function(req, res){
	req.busboy.on("file", function(fieldName, file){
		console.log(fieldName, file);

		var path = __dirname + "public/" + 'test.jpg';
		var writeStream = fs.createWriteStream(path)

		file.on('data', function(data) {
			writeStream.write(data)
		});

		file.on('end', function() {
			writeStream.end();
		});

		file.on('error', function(err) {
			console.log('something is wrong :( ');
			writeStream.close();
		});

		res.send(path);
	});
	req.pipe(req.busboy);
});
var port = 4000;
app.listen(port);
console.log("listening on port: " + port);