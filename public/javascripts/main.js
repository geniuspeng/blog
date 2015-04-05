/**
 * Created by baiyp on 2015/3/29.
 */
require.config({
    paths:{
        jquery:'jquery.min',
        bootstrap:'bootstrap.min'
        },
        shim : {
            bootstrap : {
                deps : [ 'jquery' ],
                exports : 'bootstrap'
            }
        }
    });

var padLeft = 10;
var padTop = 10;
var girlWidth = 940;
var girlHeight = 530;

var ctx;
var w;
var h;
var girlPic = new Image();
var starPic = new Image();
var lastTime;
var deltaTime;

var num = 60;
var stars = [];

var switchy = false;
var alive = 0;

require(['jquery','bootstrap','stars'],function($){
    $(document).ready(function(){

        can = document.getElementById("canvas");
        ctx = can.getContext("2d");

        w = can.width;
        h = can.height;
        document.addEventListener("mousemove",mousemove,false);
        girlPic.src = "images/bg.jpg";
        starPic.src = "images/star.png";
        for(var i = 0 ; i < num ; i++){
            var obj = new starObj();
            stars.push(obj);
            stars[i].init();
        }

        lastTime = Date.now();
        gameloop();
    });

        //刷新canvas画布
        function gameloop(){
            //window.requestAnimFrame(gameloop);
            requestAnimationFrame(gameloop);

            var now = Date.now();
            deltaTime = now - lastTime;
            lastTime = now;
            drawBackground();
            drawGirl();
            drawStars();
            aliveUpdate();
        }

        function drawBackground(){
           //alert(w);
            ctx.fillStyle = "#393550";
            ctx.fillRect(0,0,w,h);
        }

        function drawGirl(){
           // drawImg(Img,x,y,width,height)
            ctx.drawImage(girlPic, padLeft, padTop, girlWidth, girlHeight);
        }

    function mousemove(e){
        if(e.offsetX || e.layerX){
            var px = e.offsetX == undefined ? e.layerX : e.offsetX;
            var py = e.offsetY == undefined ? e.layerY : e.offsetY;
            if (px > padLeft && px < (padLeft + girlWidth) && py > padTop && py < (padTop + girlHeight)) {
                switchy = true;
            } else {
                switchy = false;
            }
        }
    }

});