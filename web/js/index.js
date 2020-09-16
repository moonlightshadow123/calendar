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

$('.select2').select2();

function onClick(info){
    var eventObject = info.event;
    event = eventObject;
    console.log(eventObject);
    getTags();
    eventToForm(event, $eventForm);
    openModal($editModal, "Edit Event with id "+event.id.toString());
}

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

var RData;

function clearForm(){
    $eventForm.find("input").val("");
    $eventForm.find("select").val("");
    $eventForm.find('input[type="checkbox"]').prop("checked", false);
    tagify.removeAllTags();
    $recurContent.css("display", "none");
    $deleteEventDiv.css("display", "none");
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
    cur_tags = event.extendedProps["tags"];

    dateToDTInput(event["start"], $form.find('input[name="start"]'));
    dateToDTInput(event["end"], $form.find('input[name="end"]'));

    // All day and recurring
    if(event.allDay){
        $form.find("#allDay").prop("checked", true);
    }
    if(event._def.recurringDef == null){
        $recur.prop("checked", false); setTimeout(function(){onCheckChange($recur[0])}, 1000);
        return;
    }
    $recur.prop("checked", true); setTimeout(function(){onCheckChange($recur[0])}, 1000);
    var rdata = event._def.recurringDef.typeData;  
    console.log(rdata);
    RData = rdata;
    dateToDInput(rdata["startRecur"], $form.find('input[name="startRecur"]'));
    dateToDInput(rdata["endRecur"], $form.find('input[name="endRecur"]'));
    duraToTInput(rdata["startTime"], $form.find('input[name="startTime"]'));
    duraToTInput(rdata["endTime"], $form.find('input[name="endTime"]'));
    dowToForm(rdata["daysOfWeek"], $form);
    //var $text = $("<span>Event ID: "+event.id+"</span>")
    //var $delete = $('<span class="delete" data-id="'+event.id+'"><i class="far fa-trash"></i></span>')
    //$editModal.find(".header").html("").append($text);//.append($delete);

}

function dowToForm(dow, $form){
    if(dow == null) return;
    /*dow.forEach(function(day){
        $form.find('option[value="'+day+'"]').attr("selected", true);
    });*/
    $form.find(".select2").val(dow).trigger("change");
}

function tagsToForm(){
    if(cur_tags == null || cur_tags.length == 0)
        return;
    var format_tags = [];
    cur_tags.forEach(function(tag){
        format_tags.push(tag["name"])
    });
    tagify.addTags(format_tags);
}

function textToInput(text, $input){
    if(text == "" || text == null || $input[0] == null)
        return;
    $input.val(text);
}


/////////////////////////////////  Date and time Convertion
Date.prototype.toIsoString = function() {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        'T' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds()) ;/*+
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);*/
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
    var isoStr = date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) ;;
    $input.val(isoStr);
    //$input.val(isoStr.substring(0,isoStr.length-1));
    //var str = date.format("YYYY-MM-DDTHH:mm:ss");
    //$input.val(str);
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

//////////////////////// Date to string
var data;

/*function postForm(){
    data = getFormData($eventForm);
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/updateEvent',
        data: JSON.stringify (data),
        contentType: "application/json",
        success: function(data) { alert('data: ' + data); },
    });
}*/

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {"daysOfWeek":[], "allDay":false};

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
    return indexed_array;
}

$confirmBtn.click(function(){
    data = getFormData($eventForm);
    postData('/updateEvent', data, function(data){refreshAll();});
});

/////////////////////////////// Tagify

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

function getTags(){
    getData(getTagsUrl, (data)=>{
        var tags = onGetTags(data["results"]);
        console.log("tag!");
        console.log(tags);
        updateWList(tags);
        tagsToForm();
    }, dismsg=false);
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

    tagify.on("dropdown:show", onSuggestionsListUpdate)
          .on("dropdown:hide", onSuggestionsListHide)
          .on('dropdown:scroll', onDropdownScroll)

    //renderSuggestionsList()

    // ES2015 argument destructuring
    function onSuggestionsListUpdate({ detail:suggestionsElm }){
        console.log( suggestionsElm )
    }

    function onSuggestionsListHide(){
        console.log("hide dropdown")
    }

    function onDropdownScroll(e){
        console.log(e.detail)
      }

    // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
    function renderSuggestionsList(){
        tagify.dropdown.show.call(tagify) // load the list
        tagify.DOM.scope.parentNode.appendChild(tagify.DOM.dropdown)
    }
}



/////////////////////////////

function mouseEnter(info){
    var event = info.event;
    //console.log(eventObject);
    //console.log(info.el);
    //console.log(info.jsEvent);
    //console.log(info.view);
    $tooltip.css("top", info.jsEvent.y+10);
    $tooltip.css("left", info.jsEvent.x+10);
    clearTooltip();
    fillTooltip(event,"title", "tooltip_title");
    fillTooltip(event,"start", "tooltip_start");
    fillTooltip(event,"end", "tooltip_end");
    fillTooltip(event,"desc", "tooltip_desc");
    fillTooltip(event,"location", "tooltip_location");
    $tooltip.stop( true, true ).fadeIn();
}

var theevent;
var tooltip_dis = false;

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
    console.log(value);
    theevent = event;
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

// Events

$deleteEventBtn.click(function(){
    var id = $eventId.val();
    dialogPop("Are you sure to delete event with id '" + id.toString() + "'?" , ()=>{
        getData("/deleteEvent?id=" + id, ()=>{refreshAll();});
    });

});

function eventDrop(info){
    $tooltip.fadeOut();
    //alert(info.event.title + " was dropped on " + info.event.start.toISOString());
    if(info.event._def.recurringDef != null){
        dialogPop("Recurring events can't be dropped!", ()=>{
           info.revert();
        });
        return;
    }
    dialogPop("Are you sure to dop the event at " + info.event.start.toLocaleDateString() + "?", ()=>{
        eventToForm(info.event, $eventForm);
        data = getFormData($eventForm);
        postData('/updateEvent', data, function(data){;refreshAll();});
    }, ()=>{
        info.revert();
    });
    /*if (!confirm("Are you sure about this change?")) {
      info.revert();
    }else{
        eventToForm(info.event, $eventForm);
        data = getFormData($eventForm);
        postData('/updateEvent', data, function(data){});
    }*/
}

function removeEvents(){
    calendar.removeAllEvents();
}

function displayEvents(events){
    console.log(events);
    events.forEach(function(event){
        event["color"] = getColor(JSON.stringify(event["tags"]));
        if(calendar.getEventById(event.id) == null)
            var eventobj = calendar.addEvent(event);
        /*eventobj.setExtendedProp("tags", event["tags"]);
        eventobj.setExtendedProp("dbid", event["id"]);
        eventobj.setProp("color", getColor(JSON.stringify(event["tags"])));*/
    });
    
}

 function getColor(text) {
    console.log(text);
    var COLORS = [
        'green', 'red', 'blue', 'purple',
        'chocolate', 'pink', 'orange', 'salmon',
        'olive', 'turquoise', 'wheat', 'lime'
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


$(function(){
    calendar = new FullCalendar.Calendar($("#calendar")[0], {
        headerToolbar: { center: 'dayGridMonth,timeGridWeek,dayGridDay,dayGridWeek,listDay,listWeek,listMonth' }, // buttons for switching between views
        //initialView: 'resourceTimelineWeek',
        views: {
            dayGridMonth: { // name of view
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
            // other view-specific options here
        },
        listDay: { buttonText: 'list day' },
            listWeek: { buttonText: 'list week' },
            listMonth: { buttonText: 'list month' }
        },
        eventClick: onClick,
        //events: 'https://fullcalendar.io/demo-events.json',
        eventMouseEnter: mouseEnter,
        eventMouseLeave: mouseLeave,
        editable: true,
        eventDrop: eventDrop,
    });
    calendar.render();
    /*
    calendar.addEventSource({
        url: 'https://fullcalendar.io/demo-events.json',
        color: 'green',
        id:1,
    });

    calendar.addEventSource({
        events: [{
            title: 'New Events!',
            start: '2020-09-12',
        },{
            groupId: 'blueEvents', // recurrent events in this group move together
            daysOfWeek: [ '4' ],
            startRecur: "2020-09-02",
            endRecur:"2020-09-23",
            startTime: '10:45:00',
            endTime: '12:45:00',
            start: '2020-09-02',
            end: '2020-09-23',
          },
        ],
        color: '#ff6666',
        id:2,
    });
    */
});
      
      