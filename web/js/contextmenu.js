var deleteTagUrl = "/deleteTag";
var getTagsUrl = "/getTags";
var getEventsByTagsUrl = "/getEventsByTags";
var updateTagUrl = "/updateTag";
var newTagUrl = "/newTag";
var tags;  

function onGetTags(tags){
    new_tags = tags.map((item)=>{return {"id":item["id"], "value":item["name"]}});
    //updateWList(aca.tags);
    tags = new_tags;
    return new_tags;
    //updateConMenu(aca.tags);
}

function itemCBK(key, opt, e){
    console.log("Clicked conmenu key = " + key + ", id = " + opt.items[key]["id"]);
    var id =  opt.items[key]["id"];
    var name = opt.items[key]["name"];
    dialogPop('Are you sure to delete tag: "' + name + '"?',()=>{
        var url = deleteTagUrl+"?tagid="+id;
        getData(url, (data)=>{console.log("delete Tag!")});
    });
}

var menuData;

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
            sep: "----------",
            addEvent:{name:"Add Event", icon:"fa-plus", callback:addEventCBK},

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

var conmenuData;

$(function(){

    $.contextMenu({
        selector: "body",//'.fc-toolbar-chunk', 
        build: function ($trigger, e){
            // check if the menu-items have been saved in the previous call
            if (conmenuData != null)
            {
                // get options from $trigger
                var options = conmenuData;//$trigger.data("contextMenuItems");
                conmenuData = null;
                return options;
            }
            else
            {
                var options = {items: {}};
                var position = {x: e.pageX, y: e.pageY};
                getData(getTagsUrl, (data)=>{
                    tags = onGetTags(data["results"]);
                    options.items = buildItems(tags);
                    // save the options on the table-row;
                    //$trigger.data("contextMenuItems", options);
                    // open the context-menu (reopen)
                    conmenuData = options;
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
    console.log(menuData);
    return menuData;
}

function refreshAll(){
    var res = [];
    console.log(tags);
    if(menuData.hasOwnProperty(0)&&menuData[0])
        res.push(0);
    tags.forEach(function(tag){
        var tagid = tag["id"];
        if(menuData.hasOwnProperty(tagid)&&menuData[tagid])
            res.push(tagid);
    });
    console.log(res);
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
        getData(url, (data)=>{console.log(data);refreshAll();} );
    });
    
}

function new_conf(key, opt, e){
    menuData = getMenuData(this, opt);
    var new_tag = menuData.new_tag;
    var url = newTagUrl + "?tagname=" + new_tag;
    //getData(url, (data)=>{console.log(data)} );
    dialogPop("Are you sure to create a new tag '" +new_tag+ "'?", ()=>{
        getData(url, (data)=>{console.log(data);refreshAll();} );
    });
}

function deleteTagCBK(key, opt, e){
    var item = opt.items["delete"]["items"][key]
    console.log(item);
    var tagid = item.id;
    var url = deleteTagUrl + "?tagid=" + tagid;
    //getData(url, (data)=>{console.log(data)});
    dialogPop("Are you sure to delete tag '" + key +"'?", ()=>{
        getData(url, (data)=>{console.log(data);refreshAll();} );
    });   
}

function addEventCBK(key, opt, e){
    console.log(key);
    clearForm();
    openModal($editModal, "Edit New Event");
}