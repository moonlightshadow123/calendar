var deleteTagUrl = "/deleteTag";
var getTagsUrl = "/getTags";
var getEventsByTagsUrl = "/getEventsByTags";
var updateTagUrl = "/updateTag";
var newTagUrl = "/newTag";
var addEventClassUrl = "/addClass";
var rmEventClassUrl = "/rmClass";

//
var classEventInfo = {};
var pre_menuData;
var menuData;
var tags;  

function onGetTags(tags){
    var new_tags = tags.map((item)=>{return {"id":item["id"], "value":item["name"]}});
    tags = new_tags;
    return new_tags;
}

function itemCBK(key, opt, e){
    //console.log("Clicked conmenu key = " + key + ", id = " + opt.items[key]["id"]);
    var id =  opt.items[key]["id"];
    var name = opt.items[key]["name"];
    dialogPop('Are you sure to delete tag: "' + name + '"?',()=>{
        var url = deleteTagUrl+"?tagid="+id;
        getData(url, (data)=>{console.log("delete Tag!")});
    });
}

function buildItems(tags){
    var items = {
            display:{
                name: "Display Tag", icon:"fa-eye", items:{
                    0:{name:"(NO TAG)", type:'checkbox'},
                    /*tag1: { name: "Tag1", type: 'checkbox', selected:true},
                    tag2: { name: "Tag2", type: 'checkbox', selected:true},*/
                    display_confirm: {name:"Confirm", icon:"fa-check", callback:dis_conf},
                }
            },
            change:{name: "Change Tag", icon: "edit",
                items:
                {
                    change_tag:{name:"Tag", type:"select", options:{}},//options: {1: 'one', 2: 'two', 3: 'three'}},
                    change_name:{name:"Change To", type:"text", value:"new tag name"},
                    change_confirm: {name:"Confirm", icon:"fa-check", callback: cha_conf},
                }
            },
            new:{ name: "New Tag", icon: "fa-plus",
                items:
                {
                    new_tag:{name: "Name", type:"text", value:""},
                    new_confirm: {name:"Confirm", icon:"fa-check", callback: new_conf},
                }
            },
            delete: {"name": "Delete Tag", "icon": "delete",
                items:{
                    /*"tag1":{"name":"tag1", icon:"delete"},
                    "tag1":{"name": "tag2", icon:"delete"},*/
                },
            },
            sep1: "----------",
            addEvent:{name:"Add Event", icon:"fa-plus", callback:addEventCBK},
            sep2: "----------",
            quite: {name:"Quit", icon:"quit",callback:()=>{}},
        };
    tags.forEach (function (tag){
        var tagname = tag["value"];
        var tagid = tag["id"];
        console.log(tag);
        console.log(tagid);
        items["display"]["items"][tagid] = {name:tagname, type:"checkbox"};
        items["delete"]["items"][tagname] = {name:tagname, icon:"delete", id:tagid, callback:deleteTagCBK};
        items["change"]["items"]["change_tag"]["options"][tagid] = tagname;
    });
    return items;
}

function buildECUrl(url){
    return url + "?id=" + classEventInfo.id + "&start=" + classEventInfo.start;
}

function doneCBK(key, opt, e){
    var url = buildECUrl(addEventClassUrl) + "&class=done";
    getData(url, (data)=>{refreshAll();}); 
}

function undoneCBK(key, opt, e){
    var url = buildECUrl(rmEventClassUrl) + "&class=done";
    getData(url, (data)=>{refreshAll();}); 
}

function urgentCBK(key, opt, e){
    var url = buildECUrl(addEventClassUrl) + "&class=urgent";
    getData(url, (data)=>{refreshAll();}); 
}

function unurgentCBK(key, opt, e){
    var url = buildECUrl(rmEventClassUrl) + "&class=urgent";
    getData(url, (data)=>{refreshAll();}); 
}

$(function(){
    $.contextMenu({
        selector: ".eventTitle",
        build: function($trigger,e){
            classEventInfo["id"] = $trigger.attr("data-id");
            classEventInfo["start"] = $trigger.attr("data-start");
            var options = {items:{}};
            /*options.items["done"] = {name:"Done", callback:doneCBK};
            options.items["undone"] = {name:"Un-Done", callback:undoneCBK};
            options.items["sep"] = "----------";
            options.items["urgent"] = {name:"Urgent", callback:urgentCBK};
            options.items["un-urgent"] = {name:"Un-Urgent", callback:unurgentCBK};*/ 
            options.items= {
                done: {name:"Done", callback:doneCBK, icon:"fa-check-square"},
                undone: {name:"Un-Done", callback:undoneCBK, icon:"fa-square"},
                sep1: "------------",
                urgent: {name:"Urgent", callback:urgentCBK, icon:"fas fa-star"},
                unurgent: {name:"Un-Urgent", callback:unurgentCBK, icon:"far fa-star"},
                sep2: "-----------",
                quit: {name:"Quit", icon:"quit",callback:()=>{}}
            };
            return options;
        }
    });
});

$(function(){

    $.contextMenu({
        selector: "body",//'.fc-toolbar-chunk', 
        build: function ($trigger, e){
            // check if the menu-items have been saved in the previous call
            if (pre_menuData != null)
            {
                // get options from $trigger
                var options = pre_menuData;//$trigger.data("contextMenuItems");
                pre_menuData = null;
                return options;
            }
            else
            {
                var options = {items: {}};
                var position = {x: e.pageX, y: e.pageY};
                getData(getTagsUrl, (data)=>{
                    tags = onGetTags(data["results"]);
                    options.items = buildItems(tags);
                    pre_menuData = options;
                    $trigger.contextMenu(position);
                }, dismsg=false);           
                return false;
            }
        },

        events: {
            show: function(opt) {
                var $this = this;
                $.contextMenu.setInputValues(opt, $this.data());
            },
            hide: function(opt) {
                var $this = this;
                //$.contextMenu.getInputValues(opt, $this.data());
                getMenuData(this,opt)
            }
        }
    });
});

function getMenuData($this, opt){
    $.contextMenu.getInputValues(opt, $this.data());
    menuData = $this.data();
    return menuData;
}

function refreshAll(){
    var res = [];
    if(menuData.hasOwnProperty(0)&&menuData[0])
        res.push(0);
    tags.forEach(function(tag){
        var tagid = tag["id"];
        if(menuData.hasOwnProperty(tagid)&&menuData[tagid])
            res.push(tagid);
    });
    postData(getEventsByTagsUrl, res, (data)=>{
        removeEvents();
        displayEvents(data);
    });
}

function dis_conf(key, opt, e){
    menuData = getMenuData(this, opt);
    refreshAll();
}

function cha_conf(key, opt, e){
    menuData = getMenuData(this, opt);
    var change_tag = menuData.change_tag;
    var change_name = menuData.change_name;
    var item = opt.items["display"]["items"][change_tag];
    var url = updateTagUrl+"?tagid=" + change_tag + "&name=" + change_name;
    dialogPop("Are you sure to change the tag '" +item.name+ "' to '" +change_name +"'?", ()=>{
        getData(url, (data)=>{refreshAll();} );
    });
    
}

function new_conf(key, opt, e){
    menuData = getMenuData(this, opt);
    var new_tag = menuData.new_tag;
    var url = newTagUrl + "?tagname=" + new_tag;
    //getData(url, (data)=>{console.log(data)} );
    dialogPop("Are you sure to create a new tag '" +new_tag+ "'?", ()=>{
        getData(url, (data)=>{refreshAll();} );
    });
}

function deleteTagCBK(key, opt, e){
    var item = opt.items["delete"]["items"][key]
    console.log(item);
    var tagid = item.id;
    var url = deleteTagUrl + "?tagid=" + tagid;
    //getData(url, (data)=>{console.log(data)});
    dialogPop("Are you sure to delete tag '" + key +"'?", ()=>{
        getData(url, (data)=>{refreshAll();} );
    });   
}

function addEventCBK(key, opt, e){
    getTags();
    clearForm();
    openModal($editModal, "Edit New Event");
}