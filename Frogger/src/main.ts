import "./style.css";
import { interval, fromEvent, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";

function main() {

  // Valid Key Inputs in the game
  type Key = 'w' | 's' | 'a' | 'd'
  type Event = 'keydown'

  // #################################################################
  // ########################### CONSTANTS ###########################
  // #################################################################

  const CONSTANTS = {

    // Game Constants
    CANVAS_SIZE: 600,
    SPACER: 400,

    // Frog Constants
    FROG_ID: "FROG",
    GAME_TICK_DURATION: 10,
    FROG_START_X: 320,
    FROG_START_Y: 560,
    FROG_MOVE_DIST_UL: -40,
    FROG_MOVE_DIST_DR: 40,
    FROG_WIDTH: 40,
    FROG_HEIGHT: 40,

    //Car Constants
    CAR_STARTING_X: 0,
    CAR_STARTING_Y: 300,
    CAR_ROW_SPACING: 49,
    CAR_COL_SPACING: 200,
    CAR_RIGHT_SPEED: 2,
    CAR_LEFT_SPEED: -2,
    CAR_WIDTH: 70,
    CAR_HEIGHT: 35,

    //Log Constants
    LOG_STARTING_X: 0,
    LOG_STARTING_Y: 25,
    LOG_ROW_SPACING: 40,
    LOG_COL_SPACING: 100,
    LOG_RIGHT_SPEED: 2,
    LOG_LEFT_SPEED: -2,
    LOG_WIDTH: 140,
    LOG_HEIGHT: 70,

  } as const;

  // ################################################################
  // ########################### WRAPPERS ###########################
  // ################################################################

  // Object types

  // Frog Object
  type Frog = Readonly<{
    id: string;
    x: number;
    y: number;
  }>;

  // Log Object
  type Log = Readonly<{
    id: string;
    x: number;
    y: number;
    speed: number;
    img: string;
  }>;

  // Car Object
  type Car = Readonly<{
    id: string;
    x: number;
    y: number;
    speed: number;
    img: string;
  }>;

  // Game State
  type State = Readonly<{
    frog: Frog;
    cars: Readonly<Car[]>;
    logs: Readonly<Log[]>;
    gameover: boolean;
    score: number;
  }>;

  // #################################################################
  // ######################## HANDLER INPUTS #########################
  // #################################################################

  class Tick { // In-game tick 
    constructor(public readonly elapsed: number) {}
  }
  
  class Move { // Up Down Left Right Movement depending on Keyboard Input (x-input / y-input)
    constructor(public readonly x_dist: number, public readonly y_dist: number) {}
  }
  
  // #################################################################
  // ########################## MAIN EVENTS ##########################
  // #################################################################

  // Game Clock 
  //    - Controls the measure of time for the game (10 ms)
  const 
    tick$ = interval(CONSTANTS.GAME_TICK_DURATION).pipe(
      map((signal) => new Tick(signal))
    ),

  // Keyboard Events (Referred to FRP Asteroids)
    keyObservable = <T>(e:Event, k:Key, result:()=>T)=>
      fromEvent<KeyboardEvent>(document,e)
        .pipe(
          // Commented code: Used to debug
          // map((s) => {console.log(s.key); return s}),
          filter(({key})=>key === k),
          filter(({repeat})=>!repeat),
          map(result));

  // Movement Inputs
  // Up and Down only moves in the y direction
  // Left and Right only moves in the x direction
  const
    moveUp$ = keyObservable('keydown','w',()=>new Move(0, CONSTANTS.FROG_MOVE_DIST_UL)),
    moveDown$ = keyObservable('keydown','s',()=>new Move(0, CONSTANTS.FROG_MOVE_DIST_DR)),
    moveLeft$ = keyObservable('keydown','a',()=>new Move(CONSTANTS.FROG_MOVE_DIST_UL, 0)),
    moveRight$ = keyObservable('keydown','d',()=>new Move(CONSTANTS.FROG_MOVE_DIST_DR, 0))

  // #################################################################
  // ######################## OBJECT CREATION ########################
  // #################################################################

  // Create multiple instances of cars
  // * NOTE: Number of objects = rowNum + colNum
  //  --- Moves in either direction depending on row number
  //  --- Implemented using tail recursion
  const 
    createCar = (rowNum: number, colNum: number, car: Car[]): Car[] => {
      if (colNum === 0 && rowNum === 0) {
        return car;
      } 
      else if (rowNum > colNum){
        const newCar: Car = {
          id: "CAR1-" + colNum + rowNum,
          x: colNum * (CONSTANTS.CAR_COL_SPACING + CONSTANTS.CAR_WIDTH),
          y: rowNum * CONSTANTS.CAR_ROW_SPACING + CONSTANTS.CAR_STARTING_Y,
          speed: rowNum % 2 == 0 ? CONSTANTS.CAR_RIGHT_SPEED * rowNum : CONSTANTS.CAR_LEFT_SPEED * rowNum,
          img: rowNum % 2 == 0 ? "../assets/car1.png" : "../assets/car2.png"
        };
        return createCar(rowNum - 1, colNum, car.concat([newCar]));
      }
      else {
        const newCar: Car = {
          id: "CAR1-" + colNum + rowNum,
          x: colNum * (CONSTANTS.CAR_COL_SPACING + CONSTANTS.CAR_WIDTH),
          y: rowNum * CONSTANTS.CAR_ROW_SPACING + CONSTANTS.CAR_STARTING_Y,
          speed: rowNum % 2 == 0 ? CONSTANTS.CAR_RIGHT_SPEED * rowNum : CONSTANTS.CAR_LEFT_SPEED * rowNum,
          img: rowNum % 2 == 0 ? "../assets/car1.png" : "../assets/car2.png"
        };
        return createCar(rowNum, colNum - 1, car.concat([newCar]));
      }
    },

    // Create multiple instances of logs
    // * NOTE: Number of objects = rowNum + colNum
    //  --- Moves in either direction depending on row number
    //  --- Implemented using tail recursion
    createLog = (rowNum: number, colNum: number, log: Log[]): Log[] => {
      if (colNum === 0 && rowNum === 0) {
        return log;
      } 
      else if (rowNum > colNum){
        const newLog: Log = {
          id: "LOG-" + colNum + rowNum,
          x: colNum * (CONSTANTS.LOG_COL_SPACING + CONSTANTS.LOG_WIDTH),
          y: rowNum * CONSTANTS.LOG_ROW_SPACING + CONSTANTS.LOG_STARTING_Y,
          speed: rowNum % 2 == 0 ? CONSTANTS.LOG_RIGHT_SPEED : CONSTANTS.LOG_LEFT_SPEED,
          img: "../assets/log2.png"
        };
        return createLog(rowNum - 1, colNum, log.concat([newLog]));
      }
      else {
        const newLog: Log = {
          id: "LOG-" + colNum + rowNum,
          x: colNum * (CONSTANTS.LOG_COL_SPACING + CONSTANTS.LOG_WIDTH),
          y: rowNum * CONSTANTS.LOG_ROW_SPACING + CONSTANTS.LOG_STARTING_Y,
          speed: rowNum % 2 == 0 ? CONSTANTS.LOG_RIGHT_SPEED : CONSTANTS.LOG_LEFT_SPEED,
          img: "../assets/log2.png"
        };
        return createLog(rowNum, colNum - 1, log.concat([newLog]));
      }
    },

    // Collision Handler
    handleCollisions = (state:State) => {

      const 
        // Checks if frog is out of the canvas
        // The values represent the boundary of the canvas
        outOfBounds = state.frog.x < 0 || state.frog.x > 560 || state.frog.y < 0 || state.frog.y > 560,

        // Checks if the frog is within the area of the river
        // The values represent the boundary of the river
        drowning =  state.frog.x > -40 && state.frog.x < 600 && state.frog.y < 280 && state.frog.y > 40,

        // Checks for collision between the frog and the cars
        // --- (Assisted by the checkCollisions function described in the Helper Function Section)
        frogCarCollison = ([a,b]:[Frog,Car]) => checkCollisions(a.x, a.y, CONSTANTS.FROG_WIDTH, CONSTANTS.FROG_HEIGHT, 
                                                                  b.x, b.y, CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT),

        // Returns true if collision between car and frog happens
        carCollided = state.cars.filter(r=>frogCarCollison([state.frog,r])).length > 0,

        // Checks for collision between the frog and the logs
        // --- (Assisted by the checkCollisions function described in the Helper Function Section)
        frogLogCollision = ([a,b]:[Frog,Log]) => checkCollisions(a.x, a.y, CONSTANTS.FROG_WIDTH, CONSTANTS.FROG_HEIGHT, 
                                                                  b.x, b.y, CONSTANTS.LOG_WIDTH, CONSTANTS.LOG_HEIGHT),

        // Returns true if collision between log and frog happens
        logCollided = state.logs.filter(r=>frogLogCollision([state.frog,r])).length > 0,

        // Situations where the frog dies
        notWicked = outOfBounds || carCollided || !(logCollided) && drowning

      return <State>{
        ...state,
        gameover: notWicked,

      }
    }

  // #################################################################
  // ######################### INITIAL STATE #########################
  // #################################################################

  // Define the Initial State of the Game
  const initialState: State = {
    frog: {
      id: "FROG",
      x: CONSTANTS.FROG_START_X,
      y: CONSTANTS.FROG_START_Y,
    },

    // Initializes the cars and logs
    cars: createCar(4, 4, []),
    logs: createLog(5, 5, []),

    gameover: false,
    score: 0,
  };

  // #################################################################
  // ######################### STATE REDUCER #########################
  // #################################################################

  // Purpose: Update Game State

  const reduceState = (currentState: State, event: Move | Tick): State => {

    // Frog arrives at objective
    const goal = currentState.frog.y < 40 && currentState.frog.x >= 280 && currentState.frog.x <= 330;

    if (event instanceof Move) {
      return {
        ...currentState, 
        // Frog Game State with Key Inputs
        frog:{...currentState.frog, 
          x: currentState.frog.x + event.x_dist, 
          y: currentState.frog.y + event.y_dist,}
        }
    }
    else if (event instanceof Tick) {
      // Checks for collision every tick interval
      return handleCollisions({
        ...currentState, 
        // Moves the frog back to the starting row upon reaching the end goal
        frog:{...currentState.frog, 
          x: currentState.frog.x, 
          y: goal ? currentState.frog.y + CONSTANTS.FROG_START_Y : currentState.frog.y,
        },
        
        // Car Game State according to game clock
        cars: currentState.cars.map((car: Car) => {
        return {
          ...car, 
          // Loops the car around the canvas when they go off the screen
            x: car.speed > 0 ? 
            (car.x < CONSTANTS.CANVAS_SIZE + CONSTANTS.CAR_WIDTH + CONSTANTS.SPACER ? car.x + car.speed : 0 - CONSTANTS.CAR_WIDTH) : 
            (car.x > 0 - CONSTANTS.CAR_WIDTH? car.x + car.speed : CONSTANTS.CANVAS_SIZE + CONSTANTS.CAR_WIDTH)}
      }),

        // Log Game State according to game clock
        logs: currentState.logs.map((log: Log) => {
        return {
          ...log, 
          // Loops the log around the canvas when they go off the screen
          x: log.speed > 0 ? 
            (log.x < CONSTANTS.CANVAS_SIZE + CONSTANTS.LOG_WIDTH + CONSTANTS.SPACER ? log.x + log.speed : 0 - CONSTANTS.LOG_WIDTH) : 
            (log.x > 0 - CONSTANTS.LOG_WIDTH? log.x + log.speed : CONSTANTS.CANVAS_SIZE + CONSTANTS.LOG_WIDTH)}
      }),

        // Updates Score - Score increase by 1 every time the frog reaches the pepega (Resets upon game over/screen refresh)
        score: goal ? currentState.score + 1 : currentState.score,
        
      });
    }
    else{
      // Otherwise just return the current state
      return currentState;
    }
  }

  // #################################################################
  // ###################### IMPURE VIEW HANDLER ######################
  // #################################################################

  // *NOTE: ALL OF THE FUNCTIONS IN THE IMPURE VIEW HANDLER ARE IMPURE

  // PRE-CONDITION: State is the updated game state
  // *NOTE: You DO NOT UPDATE STATE in updateView

  function updateView(state: State){

    const canvas = document.getElementById("CANVAS")!;

    const objectLayer = document.getElementById("objectLayer")!;

    const frog = document.getElementById("FROG")!;

    document.getElementById("SHOWSCORE")!.innerHTML = String(state.score);

    attr(frog,{x: state.frog.x, y: state.frog.y})

    // Step 1: If the object does not exist, create it dynamically using HTML elements
    // Step 2: If the object already exists, update it

    // Car State for each Car Object
    state.cars.forEach((carState: Car) => {
      // Retrieve Car HTML Element
      const car = document.getElementById(carState.id);

      if (car === null) { // Step 1: Create car
        // 1) Register its namespace and the type of HTML Element
        const newCar = document.createElementNS(objectLayer.namespaceURI, "image");

        // 2) Set required attributes
        attr(newCar, {id:carState.id, 
                      href:carState.img, 
                      width:String(CONSTANTS.CAR_WIDTH), 
                      height:String(CONSTANTS.CAR_HEIGHT), 
                      x:String(carState.x), 
                      y:String(carState.y)})

        // 3) Append it as a child of canvas
        objectLayer.appendChild(newCar);
      }
      else { // Step 2: Update the car
        attr(car, {x:String(carState.x)})
      }
    })

    // Log State for each Log Object
    state.logs.forEach((logState: Log) => {
      // Retrieve Car HTML Element
      const log = document.getElementById(logState.id);

      if (log === null) { // Step 1: Create log
        // 1) Register its namespce and the type of HTML Element
        const newLog = document.createElementNS(objectLayer.namespaceURI, "image");

        // 2) Set required attributes
        attr(newLog, {id:logState.id, 
                      href:logState.img, 
                      width:String(CONSTANTS.LOG_WIDTH), 
                      height:String(CONSTANTS.LOG_HEIGHT), 
                      x:String(logState.x), 
                      y:String(logState.y)})

        // 3) Append it as a child of canvas
        objectLayer.appendChild(newLog);
      }
      else { // Step 2: Update the log
        attr(log, {x:String(logState.x)})
      }
    })

    // Gameover Screen
    if (state.gameover){
      subscription.unsubscribe();
      const endScreen = document.createElementNS(canvas.namespaceURI, "text")!;
      attr(endScreen,{
        x: CONSTANTS.CANVAS_SIZE/6,
        y: CONSTANTS.CANVAS_SIZE/2,
        class: "gameover",
      });
      endScreen.textContent = `Game Over`;
      canvas.appendChild(endScreen);
    }

  }

  // ################################################################
  // ####################### MAIN GAME STREAM #######################
  // ################################################################

  // Merges all of the input streams
  const subscription = merge(tick$,moveUp$,moveDown$,moveLeft$,moveRight$)
  .pipe(

    // For each action, apply scan to transform and reduce their state in order to update it.
    // Initial value of scan is the initial game state, initialState
    scan(reduceState, initialState))

  // subscribe() passes the state to updateView (Impure Function) to
  // animate and visualize the game objects
  .subscribe(updateView)

  // ################################################################
  // ####################### HELPER FUNCTIONS #######################
  // ################################################################

  // All the functions here can be re-used

  // Used for setting attributes (Copied over from FRP Asteroids)
  const attr = (e:Element,o:Object) => { 
    for(const k in o) e.setAttribute(k,String(o[k])) 
  };

  // Used to detect collisions by checking overlaps in the hitboxes/boundaries of the objects
  const checkCollisions = (x1:number, y1:number, w1:number, h1:number, x2:number, y2:number, w2:number, h2:number) => {
    return (x1 + w1 >= x2 && x1 + w1 <= x2 + w2 && y1 + h1 >= y2 && y1 + h1 <= y2 + h2) ? true :
    (x1 >= x2 && x1 <= x2 + w2 && y1 >= y2 && y1 <= y2 + h2) ? true : false
  };
  
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
