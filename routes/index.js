var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    Post.getAll(null, function (err, posts) {
        if(err){
            posts = [];
        }
        res.render('index', {
            title: '主页' ,
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
    });
  });
});

/* 注册. */
router.get('/reg',checkNotLogin);
router.get('/reg', function(req, res, next) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/reg',checkNotLogin);
router.post('/reg', function(req, res, next) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检测两次密码是否一致
    if(password_re != password){
        req.flash('error','两次输入的密码不一致');
        return res.redirect('/reg');//返回注册页
    }
    //生成密码的md5值（这是什么GUI？）
    var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email: req.body.email
    });
    //检测用户名是否存在
    User.get(newUser.name,function (err,user){
        if(user){
            req.flash(err,'用户已经存在');
            return res.redirect('/reg');//返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');//返回注册页
            }
            req.session.user = user;//用户信息写入session
            req.flash('success','注册成功');
            res.redirect('/');//注册成功返回主页
        });
    });
});

/* 登陆. */
router.get('/login',checkNotLogin);
router.get('/login', function(req, res, next) {
    res.render('login', {
        title: '登陆',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/login',checkNotLogin);
router.post('/login', function(req, res, next) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/login');//用户不存在则跳转到登录页
        }
        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '密码错误!');
            return res.redirect('/login');//密码错误则跳转到登录页
        }
        //用户名密码都匹配后，将用户信息存入 session
        req.session.user = user;
        req.flash('success', '登陆成功!');
        res.redirect('/');//登陆成功后跳转到主页
    });
});

/* 发表. */
router.get('/post',checkLogin);
router.get('/post', function(req, res, next) {
    res.render('post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/post',checkLogin);
router.post('/post', function(req, res, next) {
    //res.render('post', { title: '发表' });
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
    post.save(function(err){
        if(err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        req.flash('success','发布成功');
        res.redirect('/');//发表成功后转到主页
    });
});

/* 登出. */
router.get('/logout', function(req, res, next) {
    req.session.user = null;
    req.flash('success','登出成功');
    res.redirect('/');//登出成功跳转到主页
});

router.get('/upload',checkLogin);
router.get('/upload', function(req, res, next) {
    res.render('upload', {
        title: '上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/upload',checkLogin);
router.post('/upload',function(req,res){
    for(var i in req.files){
        if(req.files[i].size == 0){
            //使用同步方式删除一个文件
            fs.unlinkSync(req.files[i].path);
            console.log('Successfully removed an empty file!');
        }else{
            var target_path = './public/images/' + req.files[i].name;
            //使用同步方式重命名一个文件、
            fs.renameSync(req.files[i].path, target_path);
            console.log('Successfully renamed a file!');
        }
        req.flash('success','文件上传成功');
        res.redirect('/upload');
    }
});

/* 存档. */
router.get('/archive', function(req, res){
    Post.getArchive(function (err,posts){
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('archive', {
            title: '存档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

/* 标签. */
router.get('/tags', function(req, res) {
    Post.getTags(function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('tags', {
            title: '标签',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        res.render('tag', {
            title: 'TAG:' + req.params.tag,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/links', function (req, res) {

        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
});

router.get('/search', function (req, res) {
    Post.search(req.query.keyword, function(err, posts){
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        res.render('search',{
            "title": "SEARCH:" + req.query.keyword,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });
});


router.get('/u/:name', function(req, res){
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/');
        }
        //查询并返回该用户所有文章
        Post.getAll(user.name, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:day/:title', function(req, res){
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err,post){
        if(err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        res.render('article',{
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/edit/:name/:day/:title',checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function(err,post){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });
});

router.post('/edit/:name/:day/:title',checkLogin);
router.post('/edit/:name/:day/:title',function(req, res){
    var currentUser = req.session.user;

    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
        var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
        if(err){
            req.flash('error',err);
            return res.redirect(url);//出错 返回文章页
        }
        //console.log(url);
        req.flash('success','修改成功');
        res.redirect(url);
    });
});

router.get('/remove/:name/:day/:title',checkLogin);
router.get('/remove/:name/:day/:title',function(req, res){
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
        if(err){
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success','删除成功');
        res.redirect('/');
    });
});

router.post('/u/:name/:day/:title',function(req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function(err){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }
        req.flash('success', '留言成功');
        res.redirect('back');
    });
});

router.use(function(req, res) {
    res.render('404');
});

module.exports = router;

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!');
        res.redirect('back');//返回之前的页面
    }
    next();
}