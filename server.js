// express是node.js中管理路由响应请求的模块，
//根据请求的URL返回相应的HTML页面。
var express = require('express'),
    app = express(), //初始化web服务器
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    
    users=[];//保存所有在线用户的昵称

app.use('/', express.static(__dirname + '/www'));//指定静态HTML文件的位置
server.listen(80);
//socket部分,io表示服务器整个socket连接，
//所以代码io.sockets.emit(‘foo’)表示所有人都可以收到该事件。
//在connection事件的回调函数中，socket表示的是当前连接到服务器的那个客户端。
//所以代码socket.emit(‘foo’)则只有自己收得到这个事件，而socket.broadcast.emit(‘foo’)则表示向除自己外的所有人发送该事件
io.on('connection', function(socket) {
    //昵称设置
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
        	/*如果昵称没有被其他用户占用，则将这个昵称压入users数组，
        	同时将其作为一个属性存到当前socket变量中，并且将这个用户在数组中的索引
        	（因为是数组最后一个元素，所以索引就是数组的长度users.length）
        	也作为属性保存到socket中，后面会用到。*/
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login'); //向所有连接到服务器的客户端发送当前登陆用户的昵称 
        };
    });
    //断开连接的事件
	socket.on('disconnect', function() {
    	//将断开连接的用户从users中删除
    	users.splice(socket.userIndex, 1);
    	//通知除自己以外的所有人
    	socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
	});
	//接收新消息
    socket.on('postMsg', function(msg,color) {
        //将消息发送到除自己外的所有用户
        socket.broadcast.emit('newMsg', socket.nickname, msg,color);
    });
    //接收用户发来的图片
 	socket.on('img', function(imgData,color) {
    	//通过一个newImg事件分发到除自己外的每个用户
     	socket.broadcast.emit('newImg', socket.nickname, imgData,color);
 	});

});