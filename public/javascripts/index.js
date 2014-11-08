var manager = new jsAnimManager();

var logocloud = document.getElementById('logocloud');

manager.registerPosition('logocloud');
logocloud.setPosition(200,280);

var anim = manager.createAnimObject("logocloud");

anim.add({property: Prop.position, to: new Pos(-300, 280), duration: 3000, ease: jsAnimEase.parabolicNeg, onComplete: domove});

var leaf = document.getElementById('leaf');
manager.registerPosition('leaf');
leaf.setPosition(50,200);

var animleaf = manager.createAnimObject("leaf");
var animleaf2= manager.createAnimObject("leaf");

animleaf.add({property: Prop.dimension, to: new Dim(400,400), duration:2000,ease: jsAnimEase.backout(0.4)});
animleaf2.add({property: Prop.position, to: new Pos(50,150),duration: 2000, ease: jsAnimEase.backout(0.4)});

var cloud2 = document.getElementById('cloud2');
manager.registerPosition('cloud2');
cloud2.setPosition(-50,300);

var animcloud2 = manager.createAnimObject("cloud2");
var animcloud22= manager.createAnimObject("cloud2");

animcloud2.add({property: Prop.dimension, to: new Dim(500,500), duration:2000,ease: jsAnimEase.backout(0.4)});
animcloud22.add({property: Prop.position, to: new Pos(-150,300),duration: 2000,ease: jsAnimEase.backout(0.4)});

var cloud3 = document.getElementById('cloud3');
manager.registerPosition('cloud3');
cloud3.setPosition(-50,450);

var animcloud3 = manager.createAnimObject("cloud3");
var animcloud32= manager.createAnimObject("cloud3");

animcloud3.add({property: Prop.dimension, to: new Dim(450,450), duration:2000,ease: jsAnimEase.backout(0.4)});
animcloud32.add({property: Prop.position, to: new Pos(-50,525),duration: 2000,ease: jsAnimEase.backout(0.4)});

var cloud4 = document.getElementById('cloud4');
manager.registerPosition('cloud4');
cloud4.setPosition(100,300);

var animcloud4 = manager.createAnimObject("cloud4");
var animcloud42= manager.createAnimObject("cloud4");

animcloud4.add({property: Prop.dimension, to: new Dim(500,500), duration:2000,ease: jsAnimEase.backout(0.4)});
animcloud42.add({property: Prop.position, to: new Pos(200,300),duration: 2000,ease: jsAnimEase.backout(0.4)});

var pencil = document.getElementById('pencil');
manager.registerPosition('pencil');
pencil.setPosition(50,430);

var animpencil = manager.createAnimObject("pencil");
var animpencil2= manager.createAnimObject("pencil");

// animpencil.add({property: Prop.wait, duration: 500});
// animpencil2.add({property: Prop.wait, duration: 500});
animpencil.add({property: Prop.dimension, to: new Dim(120,90), duration:3000,ease: jsAnimEase.parabolicNeg});
animpencil2.add({property: Prop.positionSemicircle(true), to: new Pos(-100,430),duration: 3000,ease: jsAnimEase.parabolicNeg});

var pencil = document.getElementById('imgicon');
manager.registerPosition('imgicon');
pencil.setPosition(50,150);

var animpencil = manager.createAnimObject("imgicon");
var animpencil2= manager.createAnimObject("imgicon");

// animpencil.add({property: Prop.wait, duration: 500});
// animpencil2.add({property: Prop.wait, duration: 500});
animpencil.add({property: Prop.dimension, to: new Dim(120,120), duration:2500,ease: jsAnimEase.parabolicNeg});
animpencil2.add({property: Prop.positionSemicircle(false), to: new Pos(-150,150),duration: 2500,ease: jsAnimEase.parabolicNeg});


function domove(){
	manager.registerPosition('logocloud');
	var anim = manager.createAnimObject("logocloud");
	logocloud.setPosition(-300,280);

    anim.add({property: Prop.position, to: new Pos(-280, 280), duration: 2000, ease: jsAnimEase.bounceSmooth,onComplete: domove});
}
