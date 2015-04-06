var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
    User = require('../models/user.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: '主页' ,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
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
    res.render('post', { title: '发表' });
});
router.post('/post',checkLogin);
router.post('/post', function(req, res, next) {
    //res.render('post', { title: '发表' });
});

/* 登出. */
router.get('/logout', function(req, res, next) {
    req.session.user = null;
    req.flash('success','登出成功');
    res.redirect('/');//登出成功跳转到主页
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