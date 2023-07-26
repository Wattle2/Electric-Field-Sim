function submitInpt(){
    var cInpt = document.getElementById("chargeamount") 
    // console.log("Entered value:", value);
    createBoxes(cInpt.value)
}
document.addEventListener("DOMContentLoaded", function() { //first input box
    var cInpt = document.getElementById("chargeamount")
    cInpt.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitInpt()
        }
    });
});

function createBoxes(count) {
    // var count = parseInt(document.getElementById(id).value);
    // console.log(count);
    if(isNaN(count)||count<=0||count>=1000){ //validate input
        return;
    }
    var container = document.getElementById("inputscontainer");
    container.innerHTML = ""; // Clear any existing input boxes
  
    for (var i = 0; i < count; i++) { //populate page with inputs for each charge
        var number =document.createElement("span"); //number each row
        number.innerHTML="Charge " +(i+1);

        var charge = document.createElement("input"); // charge input coloumn
        charge.type = "number";
        charge.placeholder = "Enter Charge in Coulombs";
        charge.style.marginBottom = "10px";
        charge.style.marginLeft = "10px";
        charge.style.width="180px";
        charge.setAttribute("class", "charge-strength");


        var xposition = document.createElement("input"); //xposition input coloumn
        xposition.type = "number";
        xposition.placeholder = "Enter X-position";
        xposition.style.marginBottom = "10px";   
        xposition.style.marginLeft = "10px";
        xposition.setAttribute("class", "x-values");


        var yposition = document.createElement("input"); //yposition input coloumn
        yposition.type = "number";
        yposition.placeholder = "Enter Y-position";
        yposition.style.marginBottom = "10px";
        yposition.style.marginLeft = "10px";
        yposition.setAttribute("class", "y-values");

        
        container.appendChild(number); //add all elements in each row
        container.appendChild(charge);
        container.appendChild(xposition);
        container.appendChild(yposition);
        
    

        container.appendChild(document.createElement("br")); // Add line break after each input
    }

    var submit = document.createElement("button"); //populate submit button at the bottom
    submit.setAttribute("class", "custom-button");
    submit.setAttribute("onclick", "submitData()");
    submit.innerHTML="Submit Data";
    submit.style.marginBottom = "10px";
    container.appendChild(submit);

}
function submitData(){ //respond to the onlick event
    sendRecieveData();
}

function sendRecieveData(){
     //convert raw input into arrays with numerical data ready for calculation
    var xelements = document.getElementsByClassName("x-values"); //need to convert HTML elements -> numeric inputs
    var xvalues = [];

    var yelements = document.getElementsByClassName("y-values");
    var yvalues = [];

    var chargeelements = document.getElementsByClassName("charge-strength");
    var charges = [];

    for(let i = 0; i<xelements.length;i++){
        xvalues.push(parseFloat(xelements[i].value));
        yvalues.push(parseFloat(yelements[i].value));
        charges.push(parseFloat(chargeelements[i].value));

        if(isNaN(xvalues[i])||isNaN(yvalues[i])||isNaN(charges[i])){ //validate inputs
            return;
        }
    }

    let inputdiv = document.getElementById("inputs"); //hide the input boxes, start populating simulation div
    inputdiv.style.display = "none";


    let data = {
        'xpositions': xvalues,
        'ypositions' : yvalues,
        'coulombs' : charges
    };
    // console.log(data)

    /*
    Set up an API endpoint to communicate with the Python backend (to take advantage of the OOP). 
    Convert input values into a JSON to be received by backend. Send AJAX requests for direction and force,
    which will be used in the graphic renderding.
    */

    const url = 'http://scratchers.pythonanywhere.com/'; //deployment server

    fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        // Handle the response data
        renderData(result, xvalues.length);
        printData(result)
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle error
        document.getElementById("content").innerHTML = "Could not connect to backend";
    });

}

function renderData(data, size){ //populate html5 canvas
    var container = document.getElementById("content");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "canvas");
    container.prepend(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext("2d");
    
    //convert to cartesian
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, -1);

    // Draw Cartesian axis lines
    ctx.beginPath();
    ctx.moveTo(-canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, 0);
    ctx.moveTo(0, -canvas.height / 2);
    ctx.lineTo(0, canvas.height / 2);
    ctx.strokeStyle = "black";
    ctx.stroke();

    //coordiantaes from bottom left corner of rect
    //max x = +- 640
    //max y = +- 300
    console.log(canvas.width +" "+canvas.height)
    let scalar = scaleCoordinate(data, canvas)
    for(let i  = 0; i< size;i++){
        console.log("printing "+i+" dot");
        ctx.fillStyle = "black"
        ctx.fillRect(data[i][2]*scalar-2,data[i][3]*scalar-2,4,4); //charges representation
        
        if(data[i][0]!=0)
            drawArrow(35, data[i][1], data[i][2]*scalar, data[i][3]*scalar, ctx) //draw arrow with angle
        drawLabel(i, ctx,  data[i][2]*scalar, data[i][3]*scalar)
        
        
    }
}

function scaleCoordinate(data, canvas){ //normalize all coordinates to fit in plane
    let maxX = 0
    let maxY = 0
    for(let key in data){
        if(Math.abs(data[key][2])>maxX){
            maxX = Math.abs(data[key][2])
        }
        if(Math.abs(data[key][3])>maxY){
            maxY = Math.abs(data[key][3])
        }
    }

    return  Math.min((canvas.width/2-35) / maxX, (canvas.height/2-35) / maxY);
}

function drawArrow(length, angle, x, y, ctx){
    const arrowLength = length; // Length of the arrow in pixels
    
    // Calculate the endpoint of the arrow
    const arrowEndX = x + arrowLength * Math.cos(angle);
    // const arrowEndY = y - arrowLength * Math.sin(angle);
    const arrowEndY = y + arrowLength * Math.sin(angle);
    
    // Draw the arrow body
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    
    // Draw the arrowhead
    const arrowheadSize = 10; // Size of the arrowhead in pixels
    const angleOffset = Math.PI / 8; // Angle offset for the arrowhead
    
    const arrowheadAngle1 = angle - angleOffset;
    const arrowheadAngle2 = angle + angleOffset;
    
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - arrowheadSize * Math.cos(arrowheadAngle1), arrowEndY - arrowheadSize * Math.sin(arrowheadAngle1));
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - arrowheadSize * Math.cos(arrowheadAngle2), arrowEndY - arrowheadSize * Math.sin(arrowheadAngle2));
    ctx.stroke();
}

function drawLabel(num, ctx, x, y){
    ctx.save()
    ctx.scale(1,-1)
    ctx.fillText("P"+(num+1), x-5,-1*y-10)
    ctx.restore()
}

function printData(data){
    document.getElementById("datacontainer").style.display = "block"
    table = document.getElementById("data")
    const conversionFactor = 180.0/Math.PI
    let i = 0
    for(let key in data){
        i++
        const newRow = table.insertRow()

        const point = newRow.insertCell()
        const force = newRow.insertCell()
        const angle = newRow.insertCell()
        const xpos = newRow.insertCell()
        const ypos = newRow.insertCell()

        point.textContent = "P"+i
        force.textContent = data[key][0].toFixed(5)+"N"
        angle.textContent = (data[key][1]*conversionFactor).toFixed(5)+" degrees"
        xpos.textContent = data[key][2]
        ypos.textContent = data[key][3]
    }
}