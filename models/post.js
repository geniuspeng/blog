/**
 * Created by baiyp on 2015/4/6.
 */
//var mongodb = require('./db');
var mongodb = require('mongodb').MongoClient;
var settings = require('../settings');
var markdown = require('markdown').markdown;

function Post(name,head,title,tags,post) {
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

//存储一篇文章以及相关信息
Post.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + date.getHours() + ":" +
            (date.getMinutes() <10 ? '0'+date.getMinutes() : date.getMinutes())
    }

      //要存入数据库的文档
    var post =  {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags : this.tags,
        post: this.post,
        comments: [],
        pv: 0
    };
    //打开数据库
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                db.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回 err 为 null
            });
        });
    });
};

//读取文章以及相关信息
Post.getAll = function(name, callback) {
    //打开数据库
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                db.close();
                return callback(err);
            }
            var query = {};
            if(name) {
                query.name = name;
            }
            //根据query对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function (err,docs) {
                db.close();
                if(err){
                    return callback(err);
                }
                //解析markdown问html
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null,docs);//成功，以数组形式返回查询结果
            });
        });
    });
};
Post.getOne = function(name, day, title, callback){
    //打开数据库
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                if (err) {
                   db.close();
                    return callback(err);
                }
            //每访问一次 pv值增加1
                if(doc) {
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    },{
                        $inc: {pv: 1}
                    },function(err) {
                        db.close();
                        if(err) {
                            return callback(err);
                        }
                    });
                    //解析 markdown 为 html
                    //doc.post = markdown.toHTML(doc.post);
                    doc.post = markdown.toHTML(doc.post);
                    if(doc.comments){
                        doc.comments.forEach(function(comment){
                            comment.content = markdown.toHTML(comment.content);
                        });
                    }

                }
                callback(null, doc);//返回查询的一篇文章

            });
        });
    });
};

Post.edit = function(name, day, title, callback) {
    //打开数据库
    mongodb.connect(settings.url, function(err, db){
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if (err) {
                db.close();
                return callback(err);
            }
            //根据用户名，发表日期以及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            },function(err,doc){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章
            });
        });
    });
};

Post.update = function(name, day, title, post, callback){
    mongodb.connect(settings.url, function(err,db){
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err,collection){
            if (err) {
                db.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            },{
                $set: {post: post}
            },function(err){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.remove = function(name, day, title, callback) {
    mongodb.connect(settings.url, function(err,db){
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
         //根据用户名，日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            },{
                w: 1
            },function(err){
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        })
    });
};

Post.getArchive = function(callback) {
    mongodb.connect(settings.url, function(err,db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
         //返回只包含name，time，title属性的文档组成的存档数组
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time:-1
            }).toArray(function(err, docs){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回所有标签
Post.getTags = function(callback) {
    //打开数据库
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回通过标题关键字查询的所有文章信息
Post.search =  function(keyword, callback) {
  mongodb.connect(settings.url, function (err, db) {
      if (err) {
          return callback(err);
      }
      db.collection('posts', function (err, collection) {
          if (err) {
              db.close();
              return callback(err);
          }
         // var pattern = /^.* + keyword + .*$/i;
          var pattern = new RegExp("^.*" + keyword + ".*$", "i")
          collection.find({
              "title": pattern
          },{
              "name": 1,
              "time": 1,
              "title": 1
          }).sort({
              time: -1
          }).toArray(function (err,docs){
              db.close();
              if(err) {
                  return callback(err);
              }
              callback(null, docs);
          });
      });
  });
};