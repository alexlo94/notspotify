var loading = true;
var pause = false;
//audio global variables
var song;
var songname;
var songlist;
var volume;
var level;
var spectrum;
//drawing global variables
var r = 100;
var anglestep = 360/384;
var particles = [];

//HTML element variables
//header
var title;
var listbutt;
var vizbutt;
var uploadbutt;
var refreshbutt;
//main
var cnv;
//footer
var masterplay;
var nowplaying;
var volumeslider;

//particle object definition
function Particle(){
  this.x = random(-width/2, width/2);
  this.y = random(-height/2, height/2);
  this.z = random(width/2);
  }
Particle.prototype = {
  constructor : Particle,
  show : function(){    
    fill(255);
    noStroke();
    
    var sx = map(this.x / this.z, -0.15, 1.3, 0, width/2);
    var sy = map(this.y / this.z, -0.15, 1.3, 0, height/2);
    ellipse(sx, sy, 4, 4);
    
  },
  update: function(){
    this.z = this.z - speed;
    if(this.z < 1){
      this.z = width/2;
      this.x = random(-width/2, width/2);
      this.y = random(-height/2, height/2);
    }
  }
}

//callback function for when song is loaded
function soundLoaded(song1){
  song = song1
  song.setVolume(1);
  song.play();
  volume = new p5.Amplitude();
  fft = new p5.FFT(0.8, 512);
  loading = false;
}

//setup function
function setup() {
  //create title element for our page
  title = createDiv("Still Not Spotify");
  title.id("title");
  title.class("grid_12");
  title.parent("header");
  //create the 4 buttons for our page
  //list
  listbutt = createButton("List");
  listbutt.id("listbutt");
  listbutt.class("grid_3");
  listbutt.parent("header");
  listbutt.mousePressed(listEvent);
  //viz
  vizbutt = createButton("Viz");
  vizbutt.id("vizbutt");
  vizbutt.class("grid_3");
  vizbutt.parent("header");
  vizbutt.mousePressed(vizEvent);
  //upload
  uploadbutt = createButton("Upload");
  uploadbutt.id("uploadbutt");
  uploadbutt.class("grid_3");
  uploadbutt.parent("header");
  uploadbutt.mousePressed(uploadEvent);
  //refresh
  refreshbutt = createButton("Refresh");
  refreshbutt.id("refreshbutt");
  refreshbutt.class("grid_3");
  refreshbutt.parent("header");
  refreshbutt.mousePressed(refreshEvent);






  //collect data from the server
  var songlist = httpGet('http://159.203.170.193:8083/data', 'json', function(data){
    songlist = data;

    //once data has been collected from the server, create the two main sections of the page
    //first, the songlist
    for(var i = 0; i < data.length; i++){
      //append the data piece to the songlist
      //songlist.push("hello");
      var title = data[i].filename

      var tablerow = createDiv("");
      tablerow.parent("songtable");
      tablerow.class("tablerow");
      var songname = createSpan(data[i].filename);
      songname.parent(tablerow);
      songname.class("songname");
      var playbutton = createButton("Play!");
      playbutton.parent(tablerow);
      playbutton.class("playbutton");
      playbutton.value(i);
      playbutton.mousePressed(function(){
        if(song != null){
          console.log("Song wasn't null!");
          song.setVolume(0);
          song.stop();
          volume = null;
          fft = null;
        }
        songname = data[this.value()].filename;
        nowplaying.html("Now Playing: " + songname);
        song = loadSound("http:\/\/159.203.170.193:8083\/music\/" + songname, soundLoaded);
      });
    }

    //second, the canvas
    cnv = createCanvas(940,720);
    cnv.parent('canvasholder');
    centerCanvas();
    background(255);
    stroke(0);
    colorMode(HSB, 360, 100, 100);
    angleMode(DEGREES);

    for(var i = 0; i < 800; i++){
      append(particles, new Particle());
    }

    //third, the controls
    //now playing section
    nowplaying = createDiv("Now Playing: ");
    nowplaying.parent("footer");
    nowplaying.id("nowplaying");
    //nowplaying.class("grid_6");
    nowplaying.style.textAlign = "center";
    nowplaying.style.display = "inline";
    //play/pause button, also fulfilled by esc key
    masterplay = createButton("Play/Pause");
    masterplay.id("masterplay");
    masterplay.parent("footer");
    masterplay.mousePressed(function(){
      if(!loading && pause){
        pause = false;
        song.play();
        this.html("Pause");
      }
      else if(!loading && !pause){
        pause = true;
        song.pause();
        this.html("Play");
      }
    });
    //volume slider
    volumeslider = createSlider(0.0, 1.0, 1.0, 0.01);
    volumeslider.html("Volume: ")
    volumeslider.parent("footer");
    volumeslider.id("volumeslider");
    volumeslider.value("Volume: ");
    //timeline?
  });
}

//draw loop to render the music visualizer
function draw() {
  if(loading){
    textAlign(CENTER);
    textSize(32);
    text("Loading...", width/2, height/2);
    textSize(24);
    text("Use the escape key to pause/play once the song has started.", width/2, (3*height)/4);
    //song = loadSound("http:\/\/159.203.170.193:8083\/music\/" + songname, soundLoaded);
  }
  else if (!loading && !pause && (song != null) && (volume != null) && (fft != null)){
    tones = [];
    background(0);
    translate(width/2, height/2);
    spectrum = fft.analyze();
    append(tones, fft.getEnergy("bass"));
    append(tones, fft.getEnergy("lowMid"));
    append(tones, fft.getEnergy("mid"));
    append(tones, fft.getEnergy("highMid"));
    append(tones, fft.getEnergy("treble"));
  
    level = map(fft.getEnergy("bass"), 0, 255, 0, 360);
    speed = map(fft.getEnergy("bass"), 0, 255, -10, 10);
    for(var i = 0; i < particles.length; i++){
      particles[i].update();
      particles[i].show();
    }
  
    fill(level, 80, 80, 0.7);
    beginShape();
      for(var i = 0; i <360; i++){
          var h = map(spectrum[i%tones.length], 0,255,0,300);
          vertex((r + h)*sin(i), (r + h)*cos(i));
      }
    endShape();
    checkVol();
  }
}

//event listeners for escape key to pause the song
function keyPressed(){
  if(keyCode == ESCAPE && !loading && pause){
    pause = false;
    song.play();
  }
  else if(keyCode == ESCAPE && !loading && !pause){
    pause = true;
    song.pause();
  }
}

//center canvas method
// source: https://github.com/processing/p5.js/wiki/Positioning-your-canvas
function centerCanvas() {
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  //cnv.position(x, y);
}
function windowResized() {
  centerCanvas();
}

//function to be called when the list button is hit
function listEvent(){
  var listContainer = document.getElementById("songtable");
  var vizContainer = document.getElementById("canvasholder");
  var uploadContainer = document.getElementById("uploadform");

  listContainer.style.display = "inline";
  vizContainer.style.display = "none";
  uploadContainer.style.display = "none";

}

//function to be called when the viz buttion is hit
function vizEvent(){
  var listContainer = document.getElementById("songtable");
  var vizContainer = document.getElementById("canvasholder");
  var uploadContainer = document.getElementById("uploadform");

  listContainer.style.display = "none";
  vizContainer.style.display = "inline";
  uploadContainer.style.display = "none";
}

//function to be called when the upload button is hit
function uploadEvent(){
  var listContainer = document.getElementById("songtable");
  var vizContainer = document.getElementById("canvasholder");
  var uploadContainer = document.getElementById("uploadform");

  listContainer.style.display = "none";
  vizContainer.style.display = "none";
  uploadContainer.style.display = "inline";
}

//function to be called when the refresh button is hit
function refreshEvent(){
  var listContainer = document.getElementById("songtable");
  while (listContainer.firstChild) {
    listContainer.removeChild(listContainer.firstChild);
  }

  var songlist = httpGet('http://159.203.170.193:8083/data', 'json', function(data){
    songlist = data;
    for(var i = 0; i < data.length; i++){
      //append the data piece to the songlist
      //songlist.push("hello");
      var title = data[i].filename

      var tablerow = createDiv("");
      tablerow.parent("songtable");
      tablerow.class("tablerow");
      var songname = createSpan(data[i].filename);
      songname.parent(tablerow);
      songname.class("songname");
      var playbutton = createButton("Play!");
      playbutton.parent(tablerow);
      playbutton.class("playbutton");
      playbutton.value(i);
      playbutton.mousePressed(function(){
        if(song != null){
          console.log("Song wasn't null!");
          song.setVolume(0);
          song.stop();
          volume = null;
          fft = null;
        }
        songname = data[this.value()].filename;
        nowplaying.html("Now Playing: " + songname);
        song = loadSound("http:\/\/159.203.170.193:8083\/music\/" + songname, soundLoaded);
      });
    }
  });
}

//function to check and adjust the volume of the currently playing song
function checkVol(){
  song.setVolume(volumeslider.value());
}
