# Setup

* npm install
* gulp
* open http://localhost:8080

# React express项目中 upload image或file

------

一开始遇到这个问题时，我是这样定位它的：node.js upload image<br/>
一番搜索后我得到这样的解决办法，引入`express multer`中间件<br/>
**注：Multer是一个nodejs中间件，用来处理http提交multipart/form-data，也就是文件上传。它是在busboy的基础上开发的。**

```html
<form method='post' action='/upload' enctype='multipart/form-data' >
    <input type="file" name='file1'/>
    <input type="submit" value="add"/>
</form>
```
**enctype是用来规定将`form`发送到服务器之前如何进行编码的，有以下三种值：**
> * `application/x-www-form-urlencoded`:(默认)发送前将空格变为+,特殊字符转换为 ASCII 十六进制值
> * `multipart/form-data`:不进行编码
> * `text/plain`:只把空格变为+，不不编码特殊字符

```javascript
var multer = require('multer');
var upload = multer({dest: 'public/images/'});

router.post('/upload',upload.any(),function (req,res,next) {
    res.send(req.files);
})
```

上面的代码发送post请求后，在后台这样处理,`req.files`就是接受到的文件，此方法会将文件上传到`dest`指向的路径中去。

## **BUT！！！当我将上述代码引入到一个react项目中时，这种做法是行不通的**
我搜索：react express multer,得到的大多是一些没有意义的解答，于是我开始重新定位这个问题，搜索：express react upload image,搜索到很多中方法，但归根结底都是为`type="file"`的`input`输入框绑定一个`onChange`事件，然后`e.target.files[0]`就可以取到这个文件，类型为`Object`,然后将这个`Object`类型的东西发送给服务器。<br/>那么问题来了，我想要上传一个文件到项目里，显然，现在发送回来的东西并不能直接上传！<br/>

```javascript
app.put("/upload", function(req, res){
	req.busboy.on("file", function(fieldName, file){
		console.log(fieldName, file);
		res.send(path);
	});
	req.pipe(req.busboy);
});
```
在控制台打印`file`时，发现它的类型是`fileStream`,那么，我当前要做的，一定是将`stream`转换为`file`本身,于是我搜索：node.js stream to file<br/>直到找到`fs.createReadStream`可以解决这个问题：

于是，我改写了自己的代码：
```javascript
app.put("/upload", function(req, res){
	req.busboy.on("file", function(fieldName, file){
        const path = __dirname + "/public/" + 'test.jpg';
		var writeStream = require('fs').createWriteStream(path)

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
```
接下来，这个demo调试成功我将它引入我的项目中，就在我以为大功告成的时候，新的bug站起来了，明明demo里可以跑通的代码，拿到项目里就挂！！！
```javascript
request.put("/upload")
    .attach("image-file", this.state.image, this.state.image.name)
    .end(function(res){
        console.log(res);
    });
```
我在服务器端`send`了`path`,返回给页面后，前端打印了`res`,但是demo里可以成功打印接受到的东西，项目里打印的一直是`null`<br/>于是我在服务器端返回`res.send('success!')`，打印的依然是`null`，接着我查看`network`,发现``Headers`里`Request URL`为`http://localhost:4000/upload`的`response`的确成功返回了路径信息，也就是说我的后台部分没有问题，问题出现在前端部分，且出现在`request.put`部分。<br/>因为`const request = require("superagent");`所以我搜索：superagent，得到以下结果：
> * superagent 是一个轻量的,渐进式的ajax api,可读性好,学习曲线低,内部依赖nodejs原生的请求api,适用于nodejs环境下.
另外关于`end`方法的参数，我发现有两个版本：

 1. 两年前的版本：
```javascript
 .end(function(res){
     if (res.ok) {
       alert('yay got ' + JSON.stringify(res.body));
     } else {
       alert('Oh no! error ' + res.text);
     }
```
 2. 最新的：
```javascript
.end(function(err, res){
     if (err || !res.ok) {
       alert('Oh no! error');
     } else {
       alert('yay got ' + JSON.stringify(res.body));
     }
```
对比两个版本，我的猜想是：由于我代码中是一个参数，所以；它默认`res`第一个参数`err`,因为请求和响应是成功的，所以打印的err一直是`null`,然后我做了以下验证：
```javascript
.end(function(err, res){
    console.log(err);
    console.log(res);
```
果然，打印的结果为：null ,Response {req: Request, xhr: XMLHttpRequest, text: "/home/cyr/holiday-workspace/reactjs-image-upload/public/test.jpg", ......},猜想正确!!恩，总结完毕，碎觉觉哈哈！！！




