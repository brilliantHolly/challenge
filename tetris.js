var canvas;
var gl;
var points = [];
var colors = [];
var pre_points = [];
var pre_colors = [];

var intervalPre;
var intervalPre2Now;
var intervalGame;
var intervalRoutine;

var CUBE_SIZE = 30;
var COLS = 14, ROWS = 24;
var pre_COLS = 4, pre_ROWS = 4;
var LINE_WIDTH = 1;

var backdrop = [];    //游戏背景画布，即全部的网格
var nowX, nowY;       //这个4×4矩阵最左上角的点在canvas中的哪一行、哪一列
var dir = 0;
var now_shape_kind;
var now_shape_id;
var now_shape = [];
var color_index;

var pre_shape_kind;
var pre_shape_id;
var pre_shape;
var pre_color_index;

var rotated;         //用于存储当前方块旋转之后的4×4矩阵

var settled;
var lose = false;
var score = 0;
var already_pre2now = true; //为真时，生成pre并置为假；为假时，当方块settle时将pre赋值给now，并置为真；初值为true

var SHAPE_COUNT = 7;
//条形方块、L形方块、Z形方块、田字形方块、反L形方块、反Z形方块、T形方块
var shapes = 
[
    //条形方块
    [
        1,1,1,1,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        0,0,0,1,
        0,0,0,1,
        0,0,0,1,
        0,0,0,1 
    ],
    [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        1,1,1,1
    ],
    [
        1,0,0,0,
        1,0,0,0,
        1,0,0,0,
        1,0,0,0 
    ],
    //L形方块
    [
        1,0,0,0,
        1,0,0,0,
        1,1,0,0,
        0,0,0,0
    ],
    [
        1,1,1,0,
        1,0,0,0,
        0,0,0,0,
        0,0,0,0 
    ],
    [
        0,1,1,0,
        0,0,1,0,
        0,0,1,0,
        0,0,0,0
    ],
    [
        0,0,0,0,
        0,0,1,0,
        1,1,1,0,
        0,0,0,0 
    ],
     //Z形方块
    [
        1,1,0,0,
        0,1,1,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        0,1,0,0,
        1,1,0,0,
        1,0,0,0,
        0,0,0,0 
    ],
    [
        1,1,0,0,
        0,1,1,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        0,1,0,0,
        1,1,0,0,
        1,0,0,0,
        0,0,0,0 
    ],
    //田字形方块
    [
        1,1,0,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        1,1,0,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        1,1,0,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        1,1,0,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0 
    ],
 //反L形方块
    [
        0,1,0,0,
        0,1,0,0,
        1,1,0,0,
        0,0,0,0
    ],
    [
        1,0,0,0,
        1,1,1,0,
        0,0,0,0,
        0,0,0,0 
    ],
    [
        1,1,0,0,
        1,0,0,0,
        1,0,0,0,
        0,0,0,0
    ],
    [
        1,1,1,0,
        0,0,1,0,
        0,0,0,0,
        0,0,0,0 
    ],
    //反Z形方块
    [
        0,1,1,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        1,0,0,0,
        1,1,0,0,
        0,1,0,0,
        0,0,0,0 
    ],
    [
        0,1,1,0,
        1,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        1,0,0,0,
        1,1,0,0,
        0,1,0,0,
        0,0,0,0 
    ],
    //T形方块
    [
        1,1,1,0,
        0,1,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    [
        0,0,1,0,
        0,1,1,0,
        0,0,1,0,
        0,0,0,0 
    ],
    [
        0,0,0,0,
        0,1,0,0,
        1,1,1,0,
        0,0,0,0
    ],
    [
        1,0,0,0,
        1,1,0,0,
        1,0,0,0,
        0,0,0,0 
    ]
];

//将RGB形式表示的颜色转换为webgl里面颜色的表示形式
function RGB(R, G, B) {
    return vec3(R / 255, G / 255, B / 255);
}
var CYAN = RGB(0, 255, 255);
var ORCHID = RGB(255, 193, 193);
var BLUE = RGB(0, 0, 255);
var YELLOW = RGB(255, 255, 0);
var ORANGE = RGB(255, 179, 102)
var RED = RGB(255, 0, 0);
var GREEN = RGB(65, 241, 141);
var PURPLE = RGB(128, 0, 255);
var PINK = RGB(255, 20, 147);
var BLACK = RGB(0, 0, 0);
var GREY = RGB(105,105,105);

var colorArray = [BLACK, CYAN, ORCHID, BLUE, YELLOW, ORANGE, RED, GREEN, PURPLE, PINK];

//将canvas中的像素坐标转换为webgl中的坐标
function webgl(cols, rows, x, y)
{
    var newX = (2 * x) / (CUBE_SIZE * cols) - 1;
    var newY = 1 - (2 * y) / (CUBE_SIZE * rows);
    return vec2(newX, newY);
}

//绘制三角形
function triangle(pArray, cArray, a, b, c, color)
{
    pArray.push(a);
    cArray.push(color);
    pArray.push(b);
    cArray.push(color);
    pArray.push(c); 
    cArray.push(color); 
}

//根据正方形左上角顶点在哪一行、哪一列格子计算其在canvas中的坐标(x, y)绘制正方形
function cube(pArray, cArray, cols, rows, x, y, color)
{
    var x1 = x * CUBE_SIZE;
    var x2 = (x + 1) * CUBE_SIZE;
    var y1 = y * CUBE_SIZE;
    var y2 = (y + 1) * CUBE_SIZE;
    
    var a = webgl(cols, rows, x1, y1);
    var b = webgl(cols, rows, x2, y1);
    var c = webgl(cols, rows, x2, y2);
    var d = webgl(cols, rows,x1, y2);


    triangle(pArray, cArray, a, b, c, color);
    triangle(pArray, cArray, a, c, d, color);
}

//根据长方形4个顶点分别在哪一行、哪一列绘制长方形，为了游戏开始时绘制游戏背景网格做准备
function rectangle(pArray, cArray, cols, rows, x1, x2, y1, y2, color)
{
    var newx1 = x1 * CUBE_SIZE;
    var newx2 = x2 * CUBE_SIZE + LINE_WIDTH;
    var newy1 = y1 * CUBE_SIZE;
    var newy2 = y2 * CUBE_SIZE + LINE_WIDTH;

    var a = webgl(cols, rows, newx1, newy1);
    var b = webgl(cols, rows, newx2, newy1);
    var c = webgl(cols, rows, newx2, newy2);
    var d = webgl(cols, rows, newx1, newy2);

    triangle(pArray, cArray, a, b, c, color);
    triangle(pArray, cArray, a, c, d, color);
}

//绘制游戏背景网格
function grid(pArray, cArray, cols, rows)
{
    //画竖线
    for(var i = 0; i < cols; i++)
    {
        rectangle(pArray, cArray, cols, rows, i, i, 0, rows, GREY);
    }
    //画横线
    for(var j = 0; j < rows; j++)
    {
        rectangle(pArray, cArray, cols, rows, 0, cols, j, j, GREY);
    }
}

//初始化backdrop[]数组
function initBackdrop()
{
    for(var y = 0 ; y < ROWS; y++)
    {
        if(backdrop)
        {
            backdrop[y] = [];
            for(var x = 0; x < COLS; x++)
            {
                backdrop[y][x] = 0;
            }
        } 
    }
}

//生成新的俄罗斯方块，并在pre中显示出来
function generate()
{
    if(already_pre2now)
    {
        pre_shape_kind = Math.floor(Math.random() * SHAPE_COUNT); //均衡获取0到6之间的随机整数，各代表一种俄罗斯方块
        pre_shape_id = pre_shape_kind * 4 + dir;
        pre_color_index = Math.floor(Math.random() * 9) + 1  //均衡获取1到9之间的随机整数

        update_pre();
        already_pre2now = false;
    }
}

//将生成的pre系列属性赋值传递给now系列属性，并据此初始化now_shape[]数组
function pre2now()
{
    now_shape_kind = pre_shape_kind;
    now_shape_id = pre_shape_id;
    color_index = pre_color_index;

    for(var y = 0; y < 4; ++y)
    {
        if(now_shape)
        {
            now_shape[y] = [];
        }

        for(var x = 0; x < 4; x++)
        {
            var i = 4 * y + x;
            if(shapes)
            {
                if(shapes[now_shape_id])
                {
                    if(shapes[now_shape_id][i])
                    {
                        if(now_shape)
                        {
                            if(now_shape[y])
                            {
                                 now_shape[y][x] = color_index;
                            }
                        }
                    }
                else
                {
                    if(now_shape)
                    {
                        if(now_shape[y])
                        {
                            now_shape[y][x] = 0;
                        }
                    }
                }
              
                }
            }
        }
        settled = false;
        nowX = 7;
        nowY = 0;
    
        update_game();
    }
}

//重新刷新pre画面
function update_pre()
{
    pre_points = [];
    pre_colors = [];

    for(var y = 0; y < 4; y++)
    {
        for(var x = 0; x < 4; x++)
        {
            i = 4 * y + x;
            if(shapes[pre_shape_id][i])
            {
                cube(pre_points, pre_colors, pre_COLS, pre_ROWS, x, y, colorArray[pre_color_index]);  
            }   
        }
    }

    grid(pre_points, pre_colors, pre_COLS, pre_ROWS); 

    /*
    pre_canvas = document.getElementById( "pre-gl-canvas" );
    pre_gl = WebGLUtils.setupWebGL( pre_canvas );
    if ( !pre_gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    pre_gl.viewport( 0, 0, pre_canvas.width, pre_canvas.height );
    pre_gl.clearColor( 1.0, 1.0, 1.0, 1.0 );  */

    //  Load shaders and initialize attribute buffers
    var pre_program = initShaders(pre_gl, "pre-vertex-shader", "pre-fragment-shader");
    pre_gl.useProgram(pre_program);

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var pre_pointsBuffer = pre_gl.createBuffer();
    pre_gl.bindBuffer(pre_gl.ARRAY_BUFFER, pre_pointsBuffer);
    pre_gl.bufferData(pre_gl.ARRAY_BUFFER, flatten(pre_points), pre_gl.STATIC_DRAW);

    var pre_vPosition = pre_gl.getAttribLocation(pre_program, "pre_vPosition");
    pre_gl.vertexAttribPointer(pre_vPosition, 2, pre_gl.FLOAT, false, 0, 0);
    pre_gl.enableVertexAttribArray(pre_vPosition);

    var pre_colorsBuffer = pre_gl.createBuffer();
    pre_gl.bindBuffer(pre_gl.ARRAY_BUFFER, pre_colorsBuffer);
    pre_gl.bufferData(pre_gl.ARRAY_BUFFER, flatten(pre_colors), pre_gl.STATIC_DRAW);

    var pre_vColor = pre_gl.getAttribLocation(pre_program, "pre_vColor");
    pre_gl.vertexAttribPointer(pre_vColor, 3, pre_gl.FLOAT, false, 0, 0);
    pre_gl.enableVertexAttribArray(pre_vColor);

    pre_gl.clear(pre_gl.COLOR_BUFFER_BIT);
    pre_gl.drawArrays(pre_gl.TRIANGLES, 0, pre_points.length);
}

//重新刷新游戏画面
function update_game()
{
    points = [];
    colors = [];
    
    //先把已经停靠有方块的位置着色
    for(var y = 0; y < ROWS; y++)
    {
        for(var x = 0; x < COLS; x++)
        {
            if(backdrop)
            {
                if(backdrop[y])
                {
                    if(backdrop[y][x])
                    {
                        cube(points, colors, COLS, ROWS, x, y, colorArray[backdrop[y][x]]);
                    }
                }
            } 
        }
    }

    //在前面的基础上，绘制现在正在运动的方块
    for(var y = 0; y < 4; y++)
    {
        for(var x = 0; x < 4; x++)
        {
            if(now_shape)
            {
                //console.log("now_shape=",now_shape);
                if(now_shape[y])
                {
                    //console.log("now_shape[y]=",now_shape[y]);
                    if(now_shape[y][x])
                    {
                        cube(points, colors, COLS, ROWS, nowX + x, nowY + y, colorArray[color_index]);
                    }
                }
            }   
        }
    }
    grid(points, colors, COLS, ROWS);

    /*
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );  */

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

//旋转俄罗斯方块时的处理函数，即循环取该方块的4个方位对应的描述数组
function rotated_shape(now_shape_kind)
{
    rotated = [];
    dir = (dir + 1) % 4;
    var rotated_id = now_shape_kind * 4  + dir;

    for ( var y = 0; y < 4; y++ ) 
    {
        rotated[ y ] = [];
        for ( var x = 0; x < 4; x++ ) 
        {
            var i = 4 * y + x;
            if(shapes)
            {
                if(shapes[rotated_id])
                {
                    if (shapes[rotated_id][i]) 
                    {   
                        rotated[ y ][ x ] = color_index;
                    }
                    else 
                    {
                        rotated[ y ][ x ] = 0;
                    }
                }
            }
            
        }
    }
    return rotated;
}

//检查方块是否可以继续下移、左移、右移、旋转
function check(offsetX, offsetY, ifRotate)
{
    var newX = nowX + offsetX;
    var newY = nowY + offsetY;
    
    var newNow = now_shape;
    
    if(ifRotate == 1)
    {
        newNow = rotated_shape(now_shape_kind);
    }
    for(var y = 0; y < 4; y++)
    {
        for(var x = 0; x < 4; x++)
        {
            if(newNow)
            {
                if(newNow[y])
                {
                    if(newNow[y][x])
            {
                if(typeof backdrop[newY + y] == 'undefined'
                ||typeof backdrop[newY + y][newX + x] == 'undefined'
                ||backdrop[newY + y][newX + x]
                ||newX + x < 0
                ||newX + x >= COLS
                ||newY + y >= ROWS)
                {
                    if(newY == 1 && settled)
                    {
                        lose = true;
                        document.getElementById('playbutton').disabled = false;
                    }
                    return false;
                }
                
            }
                }
            }
            
        }
    }
    return true;
}

//当方块固定时，改写backdrop[]数组中的相应值，并且将settled置为真
function settle()
{
    for(var y = 0; y < 4; y++)
    {
        for(var x = 0; x < 4; x++)
        {
            if(now_shape)
            {
                if(now_shape[y])
                {
                    if(now_shape[y][x])
                    {
                        backdrop[nowY + y][nowX + x] = now_shape[y][x];
                    }
                }
            }  
        }
    }
    settled = true;
}

//检查是否有行可以消掉
function clearLine()
{
    for(var y = 0; y < ROWS; y++)
    {
        var filled = true;
        for(var x = 0; x < COLS; x++)
        {
            if(backdrop)
            {
                if(backdrop[y])
                {
                    if(backdrop[y][x] == 0)
                    {   filled = false;
                        break;
                    }
                }
            }  
        }
        if(filled)
        {
            for(var yy = y; yy > 0; yy--)
            {
                for(var x = 0; x < COLS; x++)
                {
                    if(backdrop)
                    {
                        if(backdrop[yy])
                        {
                            if(backdrop[yy][x])
                            {
                                backdrop[yy][x] = backdrop[yy - 1][x];
                            }
                        }
                    }
                }
            }
            score = score + 10;
            y++;
        }
    }
    document.getElementById("score").innerText = score; 
}

//创建一个新游戏
function game()
{
    clearAllIntervals();
    score = 0;
    already_pre2now = true;
    document.getElementById("score").innerText = score;
    initBackdrop();
    generate();
    pre2now();
    lose = false;
    intervalPre = setInterval(generate, 1000); 
    //intervalPre2Now = setInterval(pre2now, 6000);
    intervalGame = setInterval(update_game, 40 );
    intervalRoutine = setInterval( routine, 400 );
}

//游戏默认执行主体
function routine()
{
    if(check(0, 1, 0))
    {
        nowY++;
    }
    //方块固定后
    else
    {
        settle();
        check(0, 1, 0);
        clearLine();
        if(lose)
        {
            clearAllIntervals();
            alert("游戏结束！");
            return false;
        }
        pre2now();
        already_pre2now = true;
    }
}

//根据玩家按键进行响应，←键左移，→键右移，↓键下移，↑键上移
document.onkeyup=function(e)
{
    e=window.event||e;
    if(e.key =='ArrowLeft' || e.key =='ArrowRight' ||e.key =='ArrowDown' ||e.key =='ArrowUp')
    {
        switch(e.key){
            case 'ArrowLeft': //左键，方块左移
                if (check(-1, 0, 0)) 
                {
                    --nowX;
                }
                update_game();
                break;
            case 'ArrowRight': //右键，方块右移
                if (check(1, 0, 0)) 
                {
                    ++nowX;
                }
                update_game();
                break;
            case 'ArrowDown': //向下键，方块下移
                if (check(0, 1, 0)) 
                {
                    ++nowY;
                }
                update_game();
                break;
            case 'ArrowUp': //向上键，方块旋转
                if (check(0, 0, 1)) 
                {
                    now_shape = rotated;
                }
                update_game();
                break;  
        default:
            break;
        }
    }
}

//当玩家点击“开始”按钮时，游戏开始！
function playButtonClicked() 
{
    game();
    document.getElementById("playbutton").disabled = true; 
}

function clearAllIntervals()
{
    clearInterval(intervalPre);
    //clearInterval(intervalPre2Now);
    clearInterval(intervalGame);
    clearInterval(intervalRoutine);
}
window.onload = function init()
{
    
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    grid(points, colors, COLS, ROWS);

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );  

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);


    pre_canvas = document.getElementById( "pre-gl-canvas" );
    pre_gl = WebGLUtils.setupWebGL( pre_canvas );
    if ( !pre_gl ) { alert( "WebGL isn't available" ); }

    grid(pre_points, pre_colors, pre_COLS, pre_ROWS);

    //  Configure WebGL
    pre_gl.viewport( 0, 0, pre_canvas.width, pre_canvas.height );
    pre_gl.clearColor( 1.0, 1.0, 1.0, 1.0 );  

    //  Load shaders and initialize attribute buffers
    var pre_program = initShaders(pre_gl, "pre-vertex-shader", "pre-fragment-shader");
    pre_gl.useProgram(pre_program);

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var pre_pointsBuffer = pre_gl.createBuffer();
    pre_gl.bindBuffer(pre_gl.ARRAY_BUFFER, pre_pointsBuffer);
    pre_gl.bufferData(pre_gl.ARRAY_BUFFER, flatten(pre_points), pre_gl.STATIC_DRAW);

    var pre_vPosition = pre_gl.getAttribLocation(pre_program, "pre_vPosition");
    pre_gl.vertexAttribPointer(pre_vPosition, 2, pre_gl.FLOAT, false, 0, 0);
    pre_gl.enableVertexAttribArray(pre_vPosition);

    var pre_colorsBuffer = pre_gl.createBuffer();
    pre_gl.bindBuffer(pre_gl.ARRAY_BUFFER, pre_colorsBuffer);
    pre_gl.bufferData(pre_gl.ARRAY_BUFFER, flatten(pre_colors), pre_gl.STATIC_DRAW);

    var pre_vColor = pre_gl.getAttribLocation(pre_program, "pre_vColor");
    pre_gl.vertexAttribPointer(pre_vColor, 3, pre_gl.FLOAT, false, 0, 0);
    pre_gl.enableVertexAttribArray(pre_vColor);

    pre_gl.clear(pre_gl.COLOR_BUFFER_BIT);
    pre_gl.drawArrays(pre_gl.TRIANGLES, 0, pre_points.length);
}











