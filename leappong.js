'use strict'

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
    this.ctx = args.canvasElem.getContext('2d');         //The 2D context
    this.rect = this.canvasElem.getBoundingClientRect(); //The Rect
    this.width = this.rect.width;                        //Real pixel width
    this.height = this.rect.height;                      //Real pixel height
    this.canvasElem.width = this.width;                  //Set width
    this.canvasElem.height = this.height;                //Set height
    this.backgroundColor = args.backgroundColor;         //Set background Color
    this.forgroundColor = args.forgroundColor;           //Set forground Color
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
    this.ctx.rect(0,0,this.width,this.height);
    this.ctx.stroke();
    //Draw Center Line
    this.ctx.beginPath();
    this.ctx.moveTo(this.width/2,0);
    this.ctx.lineTo(this.width/2,this.height);
    this.ctx.stroke();
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
    document.onkeypress = (e)=>{
      e = e || window.event;
      var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
      if (charCode) {
        //Check for Up key
        if(charCode == 119){ //'w'
          this.direction = -1;
          this.timestamp = Date.now();
        }
        //Check for Down key
        if(charCode == 115){ //'s'
          this.direction = 1;
          this.timestamp = Date.now();
        }
        //Check for oldSkool mode
        if(charCode == 32){
          this.oldSkoolMode = !this.oldSkoolMode;
          if(this.oldSkoolMode){
            document.getElementById("title").innerHTML = "OldSkoolPong";
          }else{
            document.getElementById("title").innerHTML = "LeapPong";
          }
        }
      }
    };
  }
}

/**
 * For us new school kids who use Leap Motion!
 * (the whole point of making this project ;)
 */
class LeapController extends Controller{
  constructor(args){
    super(args);
    
    const controllerOptions = {enableGestures: true};
    let setDirection = (dir) => {
                         this.direction = dir
                         this.timestamp = Date.now();
                        };
    
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
      let top = this.paddle.y + this.paddle.length/2 - 25;
      let bottom = this.paddle.y + this.paddle.length/2 + 25;
      
      //If top is too high move down
      if(top < this.ball.y){
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
    this.inPlay          = true; //Fun Fact this is never false you can never ever stop >:3 //TODO Add pause button
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
    this.oldSkool = new KeyboardController({sampleFreq: 250});
    
    //The Master Game Loop (simple right)
    this.interval = setInterval(()=>{
      if(this.inPlay)
        this.gameStep();
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
    this.rightController.intervalFunc(now);
    
    //Get oldSkool mode from Keyboard Controller
    this.oldSkoolMode = this.oldSkool.oldSkoolMode; 
      
    //Apply controller input to the Paddles
    this.leftPaddle.direction = this.leftController.direction;
    if(this.oldSkoolMode)
      this.rightPaddle.direction = this.oldSkool.direction;
    else
      this.rightPaddle.direction = this.rightController.direction;
    
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
    
    if(this.ball.y < 0 + this.ball.rad){
      //bounce mirror
      this.ball.vec.y = -this.ball.vec.y;
    }
    
    if(this.ball.y > this.canvas.height - this.ball.rad){
      //bounce mirror
      this.ball.vec.y = -this.ball.vec.y;
    }
    
    //Handle Paddle Collisions
    if((this.ball.x < this.leftPaddle.x + this.leftPaddle.width + this.ball.rad) &&
       (this.ball.y > this.leftPaddle.y && this.ball.y < this.leftPaddle.y + this.leftPaddle.length)){
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
       (this.ball.y > this.rightPaddle.y && this.ball.y < this.rightPaddle.y + this.rightPaddle.length)){
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
    
    this.leftScore.innerHTML = this.leftScr;
    this.rightScore.innerHTML = this.rightScr;
    
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