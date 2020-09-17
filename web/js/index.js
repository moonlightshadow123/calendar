var $calendar = $("#calendar");
var $tooltip = $("#tooltip");
var $eventForm = $("#eventForm");
var $recur = $("#recur");
var $recurContent = $("#recurContent");
var $tagsInput = $("#tagsInput");
var $deleteEventDiv = $("#deleteEventDiv");
var $deleteEventBtn = $("#deleteEventBtn");
var $eventId = $("#eventId");


var calendar;
var event;
var tagify;
var cur_tags;

// urls
var updateEventUrl = '/updateEvent';
var getTagsUrl = "/getTags";

$('.select2').select2();

///////////////////////// Ajax
function getData(url, cbk, dismsg=true){
    $.ajax({
        url: url,
        success: function(data)
        {
            console.log(data);
            if(data["res"]){
                cbk(data["res"]);
                if(dismsg)
                    infomsg(data["msg"]);
            }else{
                alertmsg(data["msg"]);
            }
        },
        error:function(){
            alertmsg("Ajax Post Form Failed!");
        }
    });
}

function postData(url, data, cbk){
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function(data)
        {
            console.log(data);
            if(data["res"]){
                cbk(data["res"]); // show response from the php script.
                infomsg(data["msg"]);
            }else{
                alertmsg(data["msg"]);
            }
        },
        error: function(){
            alertmsg("Ajax Post Form Failed!");
        }
    });
}

////////////////////////////////// Calendar
$(function(){
    calendar = new FullCalendar.Calendar($("#calendar")[0], {
        headerToolbar: { left: 'dayGridMonth,timeGridWeek,timeGridDay prev,next',
                        center:"title",
                        right:"listDay,listWeek,listMonth today" }, // buttons for switching between views
        //initialView: 'resourceTimelineWeek',
        views: {
            dayGridMonth: { // name of view
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
            // other view-specific options here
            },
            listDay: { buttonText: 'l-day' },
            listWeek: { buttonText: 'l-week' },
            listMonth: { buttonText: 'l-month' }
        },
        eventClick: onClick,
        //events: 'https://fullcalendar.io/demo-events.json',
        eventMouseEnter: mouseEnter,
        eventMouseLeave: mouseLeave,
        editable: true,
        eventDrop: eventDrop,
        eventContent: renderEvent,
    });
    calendar.render();
});

function renderEvent(arg){
    var event = arg.event;
    var view = arg.view;
    var $div = $('<div class="eventDiv">');
    var $pre_span = $('<span class="eventPre">');//.html("~Flag~");
    var $head_span = $('<span class="eventHead">');
    var $title_span = $('<span class="eventTitle" data-id="'+event.id+'" data-start="'+dateToText(event.start)+'">').html(event.title);
    $div.append($pre_span, $head_span, $title_span);
    detectRenderClass(event, $div);
    if(view.type == "dayGridMonth"){
        if(!event.allDay){
            var color = getColor(JSON.stringify(event.extendedProps.tags));
            $head_span.append($('<span class="dot" style="color:'+color+'">').html("&#9679;&nbsp;"));//.html("&#8226;"));
            $head_span.append($('<span>').html(event.start.getHours()+":"+event.start.getMinutes() + "&nbsp;"));
        }else{
            $pre_span.find("span").css("color","white");
        }
        $title_span.addClass("cut-text");   
    }
    if(view.type == "timeGridWeek" || view.type == "timeGridDay"){
        $pre_span.find("span").css("color","white");
    }
    //return {domNodes:[$head_span[0], $foot_span[0], $title_span[0]]};
    return {domNodes:[$div[0]]};
}

function detectRenderClass(event, $div){
    var ec = event.extendedProps.eventClass;
    var names = "";
    if(!event.extendedProps.recur)
        names = ec["non_recur"];
    else{
        var start = dateToText(event.start);
        if(ec["recur"].hasOwnProperty(start)){
            names = ec["recur"][start];
        }
    }
    var nameList = names.split(" ");
    nameList.forEach(function(name){
        if(name == "done")
            addDone($div);
        if(name == "urgent")
            addUrgent($div);
    });
}

function addDone($div){
    $div.find(".eventPre").append($("<span>").css("color", "green").html('<i class="fas fa-check-circle"></i>&nbsp;'));
}

function addUrgent($div){
    $div.find(".eventPre").append($("<span>").css("color", "red").html('<i class="fas fa-star"></i>&nbsp;'));
}

function eventDrop(info){
    $tooltip.fadeOut();
    //alert(info.event.title + " was dropped on " + info.event.start.toISOString());
    if(info.event._def.recurringDef != null){
        dialogPop("Recurring events can't be dropped!", ()=>{info.revert();}, ()=>{info.revert();});
        return;
    }
    dialogPop("Are you sure to dop the event at " + info.event.start.toLocaleDateString() + "?", ()=>{
        eventToForm(info.event, $eventForm);
        data = getFormData($eventForm);
        postData('/updateEvent', data, function(data){;refreshAll();});
    }, ()=>{
        info.revert();
    });
}

function removeEvents(){
    calendar.removeAllEvents();
}

function displayEvents(events){
    events.forEach(function(event){
        event["classNames"] = "event eventObj";
        event["color"] = getColor(JSON.stringify(event["tags"]));
        if(calendar.getEventById(event.id) == null)
            var eventobj = calendar.addEvent(event);
    });
}

$("body").on("click", ".event", function(){
    //console.log(".event clicked!");
});


$deleteEventBtn.click(function(){
    var id = $eventId.val();
    dialogPop("Are you sure to delete event with id '" + id.toString() + "'?" , ()=>{
        getData("/deleteEvent?id=" + id, ()=>{refreshAll();});
    });
});

function getColor(text) {
    var COLORS = [
        'LightCoral','blue', 'purple',
        'chocolate', 'tan','magenta', 'orange', 'salmon',
        'olive', 'turquoise', 'wheat', 'limegreen', 'yellowgreen', 'lightseagreen',
        'peru', 'palevioletred'
    ];
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}


function onClick(info){
    var event = info.event;
    getTags();
    eventToForm(event, $eventForm);
    openModal($editModal, "Edit Event with id "+event.id.toString());
}

function getTags(){
    getData(getTagsUrl, (data)=>{
        var tags = onGetTags(data["results"]);
        updateWList(tags);
    }, dismsg=false);
}

//////////////////////////// Modal 

function clearForm(){
    $eventForm.find("input").val("");
    $eventForm.find("select").val("");
    $eventForm.find('input[type="checkbox"]').prop("checked", false);
    $recurContent.css("display", "none");
    $deleteEventDiv.css("display", "none");
    tagify.removeAllTags();
    $eventForm.find(".select2").val([]).trigger("change");
    onCheckChange($recur);
}

function eventToForm(event, $form){
    clearForm();
    $deleteEventDiv.css("display", "block");
    // Id
    if(event.id != null)
        $eventId.attr("value", event.id)
    textToInput(event["title"], $form.find('input[name="title"]'));
    textToInput(event.extendedProps["desc"], $form.find('input[name="desc"]'));
    textToInput(event.extendedProps["location"], $form.find('input[name="location"]'));
    //cur_tags = event.extendedProps["tags"];
    tagsToForm(event.extendedProps["tags"]);

    dateToDTInput(event["start"], $form.find('input[name="start"]'));
    dateToDTInput(event["end"], $form.find('input[name="end"]'));

    // All day and recurring
    if(event.allDay){
        $form.find("#allDay").prop("checked", true);
    }
    if(!event.extendedProps.recur){
        $recur.prop("checked", false); setTimeout(function(){onCheckChange($recur[0])}, 1000);
        return;
    }
    $recur.prop("checked", true); setTimeout(function(){onCheckChange($recur[0])}, 1000);
    var rdata = event._def.recurringDef.typeData;  
    dateToDInput(rdata["startRecur"], $form.find('input[name="startRecur"]'));
    dateToDInput(rdata["endRecur"], $form.find('input[name="endRecur"]'));
    duraToTInput(rdata["startTime"], $form.find('input[name="startTime"]'));
    duraToTInput(rdata["endTime"], $form.find('input[name="endTime"]'));
    dowToForm(rdata["daysOfWeek"], $form);
}

// recur
$recur.change(function(){
    onCheckChange(this);
});

function onCheckChange(ele){
    if(ele.checked){
        $recurContent.slideDown();
        $eventForm.find('input[name="start"]').attr("disabled", true);
        $eventForm.find('input[name="end"]').attr("disabled", true);
    }else{
        $recurContent.slideUp();
        $eventForm.find('input[name="start"]').attr("disabled", false);
        $eventForm.find('input[name="end"]').attr("disabled", false);
    }
}

// xx to Form
function dowToForm(dow, $form){
    if(dow == null) return;
    $form.find(".select2").val(dow).trigger("change");
}

function tagsToForm(tags){
    if(tags == null || tags.length == 0)
        return;
    var format_tags = [];
    tags.forEach(function(tag){
        format_tags.push(tag["name"])
    });
    tagify.addTags(format_tags);
}

function textToInput(text, $input){
    if(text == "" || text == null || $input[0] == null)
        return;
    $input.val(text);
}

function pad(num){
    var norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
}

function dateToDInput(date, $input){
    if(date == null || $input[0] == null)
        return;
    var str = date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate());
    $input.val(str);

}

function dateToDTInput(date, $input){
    if(date == null || $input[0] == null)
        return;
    var isoStr = dateToText(date);
    $input.val(isoStr);
}

function dateToText(date){
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds());
}

function msToTime(s) {
  // Pad to 2 or 3 digits, default is 2
  function p(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return p(hrs) + ':' + p(mins) + ':' + p(secs) + '.' + p(ms, 3);
}

function duraToTInput(duration, $input){
    if(duration == null || $input[0] == null)
        return;
    var str = msToTime(duration.milliseconds);
    $input.val(str);
}

// serialize form 
var data;

function emptyKeys(json, keys){
    keys.forEach(function(key){
        if(json.hasOwnProperty(key))
            json[key]="";
    });
}

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {"daysOfWeek":[], "allDay":false,"recur":false};

    $.map(unindexed_array, function(n, i){
        if(!indexed_array.hasOwnProperty(n['name']))
            indexed_array[n['name']] = n['value'];
        else{
            var old_val = indexed_array[n['name']];
            if(typeof(old_val) == "object")
                indexed_array[n['name']].push(n['value']);
            else{
                indexed_array[n['name']]= true;
            }
        }
    });
    if(indexed_array["daysOfWeek"] == [])
        delete indexed_array["daysOfWeek"];
    if(indexed_array["recur"] == false){
        emptyKeys(indexed_array, ["startRecur", "endRecur", "startTime", "endTime", "daysOfWeek"]);
    }
    console.log(indexed_array);
    return indexed_array;
}

$confirmBtn.click(function(){
    data = getFormData($eventForm);
    postData(updateEventUrl, data, function(data){refreshAll();});
});

/////////////////////////////// Tagify
setup_tagify();

function setup_tagify(){
    tagify = new Tagify($tagsInput[0], {
        //whitelist : ["A# .NET", "A# (Axiom)", "A-0 System", "A+", "A++", "ABAP", "ABC", "ABC ALGOL", "ABSET", "ABSYS", "ACC", "Accent", "Ace DASL", "ACL2", "Avicsoft", "ACT-III", "Action!", "ActionScript", "Ada", "Adenine", "Agda", "Agilent VEE", "Agora", "AIMMS", "Alef", "ALF", "ALGOL 58", "ALGOL 60", "ALGOL 68", "ALGOL W", "Alice", "Alma-0", "AmbientTalk", "Amiga E", "AMOS", "AMPL", "Apex (Salesforce.com)", "APL", "AppleScript", "Arc", "ARexx", "Argus", "AspectJ", "Assembly language", "ATS", "Ateji PX", "AutoHotkey", "Autocoder", "AutoIt", "AutoLISP / Visual LISP", "Averest", "AWK", "Axum", "Active Server Pages", "ASP.NET", "B", "Babbage", "Bash", "BASIC", "bc", "BCPL", "BeanShell", "Batch (Windows/Dos)", "Bertrand", "BETA", "Bigwig", "Bistro", "BitC", "BLISS", "Blockly", "BlooP", "Blue", "Boo", "Boomerang", "Bourne shell (including bash and ksh)", "BREW", "BPEL", "B", "C--", "C++ – ISO/IEC 14882", "C# – ISO/IEC 23270", "C/AL", "Caché ObjectScript", "C Shell", "Caml", "Cayenne", "CDuce", "Cecil", "Cesil", "Céu", "Ceylon", "CFEngine", "CFML", "Cg", "Ch", "Chapel", "Charity", "Charm", "Chef", "CHILL", "CHIP-8", "chomski", "ChucK", "CICS", "Cilk", "Citrine (programming language)", "CL (IBM)", "Claire", "Clarion", "Clean", "Clipper", "CLIPS", "CLIST", "Clojure", "CLU", "CMS-2", "COBOL – ISO/IEC 1989", "CobolScript – COBOL Scripting language", "Cobra", "CODE", "CoffeeScript", "ColdFusion", "COMAL", "Combined Programming Language (CPL)", "COMIT", "Common Intermediate Language (CIL)", "Common Lisp (also known as CL)", "COMPASS", "Component Pascal", "Constraint Handling Rules (CHR)", "COMTRAN", "Converge", "Cool", "Coq", "Coral 66", "Corn", "CorVision", "COWSEL", "CPL", "CPL", "Cryptol", "csh", "Csound", "CSP", "CUDA", "Curl", "Curry", "Cybil", "Cyclone", "Cython", "Java", "Javascript", "M2001", "M4", "M#", "Machine code", "MAD (Michigan Algorithm Decoder)", "MAD/I", "Magik", "Magma", "make", "Maple", "MAPPER now part of BIS", "MARK-IV now VISION:BUILDER", "Mary", "MASM Microsoft Assembly x86", "MATH-MATIC", "Mathematica", "MATLAB", "Maxima (see also Macsyma)", "Max (Max Msp – Graphical Programming Environment)", "Maya (MEL)", "MDL", "Mercury", "Mesa", "Metafont", "Microcode", "MicroScript", "MIIS", "Milk (programming language)", "MIMIC", "Mirah", "Miranda", "MIVA Script", "ML", "Model 204", "Modelica", "Modula", "Modula-2", "Modula-3", "Mohol", "MOO", "Mortran", "Mouse", "MPD", "Mathcad", "MSIL – deprecated name for CIL", "MSL", "MUMPS", "Mystic Programming L"],
        whitelist: [
            { value:'Afghanistan', code:'AF' },
            { value:'Åland Islands', code:'AX' }
            ],
        dropdown: {
            maxItems: Infinity,
            enabled: 1,
            classname: "customSuggestionsList"
        },
        editTags : false, 
        enforceWhitelist: true,
    })
}

function setTags(tagids, tags){
    var data = []
    tagids.forEach(function(tagid, idx){
        data.push({"id":tagid,"value":tags[idx]});
    });
    tagify.addTags(data)
}

function updateWList(whitelist){
    tagify.settings.whitelist = whitelist;
}

///////////////////////////// Tooltip

function mouseEnter(info){
    var event = info.event;
    $tooltip.css("top", $(window).scrollTop()+info.jsEvent.y+10);
    $tooltip.css("left", info.jsEvent.x+10);
    clearTooltip();
    fillTooltip(event,"title", "tooltip_title");
    fillTooltip(event,"start", "tooltip_start");
    fillTooltip(event,"end", "tooltip_end");
    fillTooltip(event,"desc", "tooltip_desc");
    fillTooltip(event,"location", "tooltip_location");
    $tooltip.stop( true, true ).fadeIn();
}

function clearTooltip(){
    $tooltip.find(".tooltip_row").css("display", "");
    $tooltip.find(".content").html("");
}

function fillTooltip(event, name, eleid){
    var value = "";
    if(event[name] != null)
        value = event[name];
    if(event.extendedProps[name] != null)
        value = event.extendedProps[name];
    if(value!="")
        if(typeof(value)=="object")
            $tooltip.find("#"+eleid).find(".content").html(value.toLocaleString());
        else
            $tooltip.find("#"+eleid).find(".content").html(value);
    else
        $tooltip.find("#"+eleid).css("display", "none");
}

function mouseLeave(info){
   $tooltip.stop( true, true ).fadeOut();
}   
      