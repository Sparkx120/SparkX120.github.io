'use strict'

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 SparkX120 (James Wake)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/

/**
 * Ball Object representing any ball type object
 */
class Ball {
  constructor(args){
    this.x     = args.x;     //X position (center)
    this.y     = args.y;     //Y position (center)
    this.rad   = args.rad;   //Radius
    this.vec   = args.vec;   //Motion Vector
    this.color = args.color; //
  }
  
  /**
   * Called every frame
   */
  timeStep(){
    this.x = this.x+this.vec.x;
    this.y = this.y+this.vec.y;
  }
  
  /**
   * Called to render to a 2D context
   */
  drawable(ctx){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

/**
 * A rectangular object used to reflect other objects
 */
class Paddle {
  constructor(args){
    this.length    = 150;             //The "height" of the paddle
    this.width     = 10;              //The width of the paddle
    this.x         = args.x;          //The paddles top left x position
    this.y         = args.y;          //The paddles top left y position
    this.totalH    = args.totalH;     //The total height of the canvas this is in //TODO Make this dynamic
    this.direction = 0;               //The direction that this paddle is moving (-1 up 1 down 0 not)
    this.speed     = args.speed;      //The speed factor to move this paddle at.
    this.color     = "rgba(0,0,0,1)"; //The color of this paddle
  }
  
  /**
   * Called every frame
   */
  timeStep(){
    //Compute weather this is hitting the top or bottom (dont move further in that direction if so)
    if(this.y > 0 && this.direction < 0)
      this.y += this.direction*this.speed;
    else if(this.y < this.totalH-this.length && this.direction > 0)
      this.y += this.direction*this.speed;
  }
  
  /**
   * Called to render to a 2D context
   */
  drawable(ctx){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x,this.y,this.width,this.length);
  }
}

/**
 * A Wrapper around an HTML5 Canvas
 */
class Canvas {
  constructor(args){
    this.canvasElem = args.canvasElem;                   //The Canvas Element
    this.canvasB = document.createElement("canvas");     //Create a buffer canvas
    this.ctx = this.canvasB.getContext('2d');         //The Buffered 2D context
    this.ctxF = args.canvasElem.getContext('2d');        //The Final 2D context
    this.rect = this.canvasElem.getBoundingClientRect(); //The Rect
    this.width = this.rect.width;                        //Real pixel width
    this.height = this.rect.height;                      //Real pixel height
    this.canvasElem.width = this.width;                  //Set width
    this.canvasElem.height = this.height;                //Set height
    this.canvasElem.style.width = this.width +"px";      //Force Real width;
    this.canvasElem.style.height = this.height + "px";   //Force Real height;
    this.canvasB.width = this.width;                  //Set width
    this.canvasB.height = this.height;                //Set height
    this.canvasB.style.width = this.width +"px";      //Force Real width;
    this.canvasB.style.height = this.height + "px";   //Force Real height;
    this.backgroundColor = args.backgroundColor;         //Set background Color
    this.forgroundColor = args.forgroundColor;           //Set forground Color
  }
  
  /**
   * Draw a new game canvas
   */
  newGame(){
    let aspect  = this.width/this.height;
    let iaspect = imageW/imageH;
    let width   = 0;
    let height  = 0;
    let factor  = 0;
    let xpos    = 0;
    let ypos    = 0;
    
    if(aspect > iaspect){
      factor = imageH/this.height;
      height = this.height;
      width  = imageW/factor;
      xpos   = (this.width - width)/2;
    }
    else{
      factor = imageW/this.width;
      width  = this.width;
      height = imageH/factor;
      ypos   = (this.height - height)/2;
    }
    
    
    //Clear
    this.ctx.beginPath();
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0,0,this.width,this.height);
    this.ctx.drawImage(startImage, xpos, ypos, width, height);
    
    this.drawBuffer();
  }
  
  /**
   * Redraw blank canvas with background objects in it
   */
  clear(){
    //Clear
    this.ctx.beginPath();
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0,0,this.width,this.height);
    //Draw Box
    this.ctx.strokeStyle = this.forgroundColor;
    this.ctx.strokeWidth = 2;
    this.ctx.rect(0,0,this.width-1,this.height-1);
    this.ctx.stroke();
    //Draw Center Line
    this.ctx.beginPath();
    this.ctx.moveTo(this.width/2,0);
    this.ctx.lineTo(this.width/2,this.height);
    this.ctx.stroke();
    
    this.drawBuffer();
    
  }
  
  drawBuffer(){
    //Draw Buffer to Screen
    this.ctxF.beginPath();
    this.ctxF.fillStyle = this.backgroundColor;
    this.ctxF.fillRect(0,0,this.width,this.height);
    this.ctxF.drawImage(this.canvasB, 0, 0);
  }
}

/**
 * Controller Super Class for all your controlling neeeds
 */
class Controller{
  constructor(args){
    this.sampleFreq = args.sampleFreq; //Frequency to Sample Data (erase direction)
    this.timestamp = Date.now();       //The current time
    this.direction = 0;                //The direction this controller is going right now (see paddle directions)
    
    /**
     * The interval function is called every frame with the current time.
     */
    this.intervalFunc = (now)=>{
      if((now - this.timestamp) > this.sampleFreq){
        this.direction = 0;
      }
    };
  }
}

/**
 * For the old school kids who don't use Leap Motion?
 * (also great for testing...)
 */
class KeyboardController extends Controller{
  constructor(args){
    super(args);
    this.oldSkoolMode = false;
    //Ancient method of listening for keystrokes
    document.onkeydown = (e)=>{
      e = e || window.event;
      var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
      if (charCode) {
        //Check for Up key
        if(charCode == 87){ //'w'
          this.direction = -1;
          this.timestamp = Date.now();
        }
        //Check for Down key
        if(charCode == 83){ //'s'
          this.direction = 1;
          this.timestamp = Date.now();
        }
        //Check for oldSkool mode
        if(charCode == 32){
          this.oldSkoolMode = !this.oldSkoolMode;
        }
      }
    };
    document.onkeyup = (e)=>{
      e = e || window.event;
      var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
      if (charCode) {
        //Check for Up key
        if(charCode == 87){ //'w'
          this.direction = 0;
          this.timestamp = Date.now();
        }
        //Check for Down key
        if(charCode == 83){ //'s'
          this.direction = 0;
          this.timestamp = Date.now();
        }
      }
    };
  }
}

/**
 * For the slightly less old school kids who don't use Leap Motion?
 */
class TouchController extends Controller{
  constructor(args){
    super(args);
    this.oldSkoolMode = false;
    
    this.paddle = args.paddle;
    this.canvas = args.canvas;
    //less acient method for listening for touches
    document.getElementById('canvas').addEventListener('touchmove', (event) => {
      // If there's exactly one finger inside this element
      if (event.targetTouches.length == 1) {
        var touch = event.targetTouches[0];
        let y = touch.pageY - this.canvas.rect.top - this.paddle.length/2;
        if(y > this.paddle.y){
          this.direction = 1
          this.timestamp = Date.now();
        }
        if(y < this.paddle.y){
          this.direction = -1
          this.timestamp = Date.now();
        }
      }
    }, false);
  }
}



/**
 * For us new school kids who use Leap Motion!
 * (the whole point of making this project ;)
 */
class LeapController extends Controller{
  constructor(args){
    super(args);
    
    this.handDetected = false;
    
    const controllerOptions = {enableGestures: true};
    let setDirection = (dir) => {
                         this.direction = dir
                         this.timestamp = Date.now();
                        };
                        
    let setHandDetected = (detected) => {this.handDetected = detected;};
    
    //The Leap Motion controller loop function
    Leap.loop(controllerOptions, function(frame) {
      
      //If We see hands we use them
      if (frame.hands.length > 0) {
        //We use all hands to update input
        //Fun fact this makes things interesting when friends
        //are being fun at parties and interfering with your
        //attempts to play the game.
        //Ofc its trivial to use only one hand but that would
        //be less fun and "social"
        for (let i = 0; i < frame.hands.length; i++) {
          let hand = frame.hands[i];
          //We use one finger (your index) to compute direction
          if(hand.indexFinger.extended){
            setHandDetected(true);
            let nameMap = ["thumb", "index", "middle", "ring", "pinky"];
            let pointer = null;
            hand.pointables.forEach(function(pointable){
              if(nameMap[pointable.type] == "index") pointer = pointable;
            });
            if(pointer){
              //If we have found your index finger we now use its direction to set our direction
              let direction = pointer.direction;
              if(direction[1] > 0.3){
                setDirection(-1);
              }
              if(direction[1] < -0.3){
                setDirection(1);
              }
            }
          }else{
            setHandDetected(false);
          }
        }
      }
    });
  }
  
}

/**
 * Dirty Cheating Computers
 * Oh yes this is a very stupid and rather annoying to beat
 * AI Controller.
 */
class AIController extends Controller{
  constructor(args){
    super(args);
    this.ball   = args.ball;
    this.paddle = args.paddle;
    
    //Use our own interval synced with the sample rate
    this.interval = setInterval(()=>{
      //Figure out where our paddle is relative to ball in y axis with a threshold
      let top = this.paddle.y + this.paddle.length/2;
      let bottom = this.paddle.y + this.paddle.length/2;
      
      //If top is too high move down
      if(top < this.ball.y ){
        this.direction = 1;
        this.timestamp = Date.now();
      }
      //If bottom is too low move up
      if(bottom > this.ball.y){
        this.direction = -1;
        this.timestamp = Date.now();
      }
      
      //If within range dont move
      if(top > this.ball.y && bottom < this.ball.y){
        this.direction = 0;
        this.timestamp = Date.now();
      }
      
      if(top > this.ball.y - 25 && bottom < this.ball.y + 25 && this.ball.vec.y < 0.5){
        this.direction = 0;
        this.timestamp = Date.now();
      }
    },this.sampleFreq);
  }
}

/**
 * At last here is the Game Object!!! This is where
 * all the high level game state stuff happens and
 * where the master game loop resides.
 */
class Pong {
  constructor(canvas){
    this.framerate       = 20;   //The frame rate we want to run at
    this.inPlay          = false; //Fun Fact this is never false you can never ever stop >:3 //TODO Add pause button
    this.newGameShowing  = false; //Weather New game is showing
    this.oldSkoolMode    = false; //Enable OldSkool controls
    
    //All the fun Score objects (hint the left will win if its a cheating computer unless you are a god)
    this.leftScore       = document.getElementById("leftScore");
    this.rightScore      = document.getElementById("rightScore");
    this.leftScr         = 0;
    this.rightScr        = 0;
    
    //The Canvas Object
    this.canvas          = new Canvas({canvasElem:canvas,
                                       backgroundColor: "rgba(255,255,255,1)",
                                       forgroundColor: "rgba(0,0,0,1)"
                           });
    
    //Our round object that we want to play with
    this.ball            = new Ball({x:this.canvas.width/2,
                                      y:this.canvas.height/2,
                                      rad:10,
                                      vec:{x:5,y:0},
                                      color:"rgba(0,0,0,1)"
                           });
    
    //The Cheating Computer's Paddle
    this.leftPaddle      = new Paddle({x:10,
                                       y:(canvas.height/2)-50,
                                       speed: 4,
                                       totalH: this.canvas.height,
                                       color:"rgba(0,0,0,1)"
                           });
    
    //The Human's Paddle
    this.rightPaddle     = new Paddle({x:canvas.width-20,
                                       y:(canvas.height/2)-50,
                                       speed: 6,
                                       totalH: this.canvas.height,
                                       color:"rgba(0,0,0,1)"
                           });
    
    //The Cheating Computer (I have handicaped him with a speed factor half that of yours)
    this.leftController  = new AIController({sampleFreq: this.framerate,
                                             ball: this.ball, 
                                             paddle: this.leftPaddle
                           });
    
    //The Human using a Leap Motion //TODO Add option for old school players aka Keyboard
    this.rightController = new LeapController({sampleFreq: this.framerate});
    
    //For those who want to be old school
    this.oldSkool = new KeyboardController({sampleFreq: 1000}); //Low Sample so as to allow for keyup
    
    //For those who want to be slightly less old school //Not enough time to finish
    // this.lessOldSkool = new TouchController({sampleFreq: this.framerate, //Sample rate is ignored by Touch
    //                                          paddle:this.rightPaddle,
    //                                          canvas:this.canvas});
    
    this.canvas.canvasElem.onclick = ()=>{
      this.inPlay = !this.inPlay;
      //this.oldSkool.oldSkoolMode = true; //this seems confusing since it says to hit space for oldSkool
      if(!this.inPlay){
        this.leftScr = 0;
        this.rightScr = 0;
        this.leftScore.innerHTML = "0";
        this.rightScore.innerHTML = "0";
      }
    }
    
    //The Master Game Loop (simple right)
    this.interval = setInterval(()=>{
      if(this.rightController.handDetected){
        this.inPlay = true;
      }
      if(this.oldSkool.oldSkoolMode){
        this.inPlay = true;
      }
      if(this.inPlay){
        this.gameStep();
        this.newGameShowing = false;
      }else{
        if(!this.newGameShowing){
          this.canvas.newGame();
          this.newGameShowing = true;
        }
      }
    },this.framerate);
  }
  
  /**
   * Compute a state change through a single step of the game.
   * (oh wait... not so simple...)
   */
  gameStep(){
    
    let now = Date.now(); //The current timestamp (please note that time travel will make this work oddly)
    
    //Update Controller input
    this.leftController.intervalFunc(now);
    this.oldSkool.intervalFunc(now);
    // this.lessOldSkool.intervalFunc(now);
    this.rightController.intervalFunc(now);
    
    //Get oldSkool mode from Keyboard Controller
    this.oldSkoolMode = this.oldSkool.oldSkoolMode; 
      
    //Apply controller input to the Paddles
    this.leftPaddle.direction = this.leftController.direction;
    if(this.oldSkoolMode)
      this.rightPaddle.direction = this.oldSkool.direction;
    else{
      //console.log(this.lessOldSkool.timestamp > this.rightController.timestamp);
      // if(this.lessOldSkool.timestamp > this.rightController.timestamp){
        // this.rightPaddle.direction = this.lessOldSkool.direction;
      // }
      // else{
        this.rightPaddle.direction = this.rightController.direction;
      // }
    }
    //console.log(this.rightPaddle.direction);
    
    //Update the positions of the Round thing and the Paddles
    this.ball.timeStep();
    this.leftPaddle.timeStep();
    this.rightPaddle.timeStep();
    
    //Handle Wall Collisions
    if(this.ball.x < 0 + this.ball.rad){
      //left player loss
      this.rightScr += 1;
      this.ball.x = this.canvas.width/2;
      this.ball.y = this.canvas.height/2;
      this.ball.vec = {x:5,y:0}
    }
    
    if(this.ball.x > this.canvas.width - this.ball.rad){
      //right player loss
      this.leftScr += 1;
      this.ball.x = this.canvas.width/2;
      this.ball.y = this.canvas.height/2;
      this.ball.vec = {x:-5,y:0}
    }
    
    var newVec = this.ball.vec;
    if(this.ball.y < 0 + this.ball.rad && this.ball.vec.y < 0){
      //bounce mirror
      this.ball.vec.y = -this.ball.vec.y;
    }
    
    if(this.ball.y > this.canvas.height - this.ball.rad && this.ball.vec.y > 0){
      //bounce mirror
      this.ball.vec.y = -this.ball.vec.y;
    }
    
    //Handle Paddle Collisions
    if((this.ball.x < this.leftPaddle.x + this.leftPaddle.width + this.ball.rad) &&
       (this.ball.y > this.leftPaddle.y && this.ball.y < this.leftPaddle.y + this.leftPaddle.length) &&
       this.ball.vec.x < 1){
      //bounce
      this.ball.vec.x = -this.ball.vec.x
      let yreflectmod = this.ball.y - (this.leftPaddle.y + this.leftPaddle.length/2);
      if(yreflectmod > 2){ //Dumb angle calulation
        yreflectmod = 2;
      } 
      if(yreflectmod < -2){
        yreflectmod = -2;
      }
      this.ball.vec.y = this.ball.vec.y + yreflectmod;
    }
    
    if((this.ball.x > this.rightPaddle.x - this.ball.rad) && 
       (this.ball.y > this.rightPaddle.y && this.ball.y < this.rightPaddle.y + this.rightPaddle.length) &&
       this.ball.vec.x > 1){
      //bounce
      this.ball.vec.x = -this.ball.vec.x
      let yreflectmod = this.ball.y - (this.rightPaddle.y + this.rightPaddle.length/2);
      if(yreflectmod > 4){ //Dumb angle calculation
        yreflectmod = 4;
      } 
      if(yreflectmod < -4){
        yreflectmod = -4;
      }
      this.ball.vec.y = this.ball.vec.y - yreflectmod; 
    }
    
    //Redraw the Beautiful Canvas (ITS ART I SWEAR)
    this.canvas.clear();
    this.ball.drawable(this.canvas.ctx);
    this.leftPaddle.drawable(this.canvas.ctx);
    this.rightPaddle.drawable(this.canvas.ctx);
    
    this.canvas.drawBuffer();
    
    this.leftScore.innerHTML = this.leftScr;
    this.rightScore.innerHTML = this.rightScr;
    
    if(this.oldSkoolMode){
      document.getElementById("title").innerHTML = "OldSkoolPong";
    }else{
      document.getElementById("title").innerHTML = "LeapPong";
    }
  }
}

/**
 * Helper function for Leap Motion Vectors
 */
function vectorToString(vector, digits) {
  if (typeof digits === "undefined") {
    digits = 1;
  }
  return "(" + vector[0].toFixed(digits) + ", "
             + vector[1].toFixed(digits) + ", "
             + vector[2].toFixed(digits) + ")";
}

/**
 * Self Calling Function to create THE GAME (did you just loose "the game"" again?)
 */
(()=>{
   new Pong(document.getElementById("canvas"));
})();

var imageW = 1821;
var imageH = 926;
var startImage = new Image();
startImage.src = 'data:image/png;base64,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';
