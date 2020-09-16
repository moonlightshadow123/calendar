from flask import Flask, jsonify, request, send_from_directory
from utils import addPath, getTraceLog
import orm, json

app = Flask(__name__, static_url_path='', static_folder="../web")   

@app.route('/getTags')
def getTags():
    #tagid = request.args.get("tagid", type=int)
    res = None
    try:
        res = orm.getTags()
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route('/getEventsByTags',methods=["POST"])
def getEventsByTags():
    tagsdata = request.get_json()
    print(tagsdata)
    try:
        res = orm.getEventsByTags(tagsdata)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route("/deleteEvent")
def deleteEvent():
    eventId = request.args.get("id")
    res = None;
    try:
        res = orm.deleteEvent(eventId)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route('/updateEvent', methods=["POST"])
def updateEvent():
    data = request.get_json()
    print(data)
    eventId = data["id"]
    tags = data["tags"]
    if eventId == "" or eventId == "0":
        try:
            del data["id"]
            event = orm.createEvent(data)
            data["id"] = event.id
            eventId = event.id
        except Exception as e:
            getTraceLog(e)
            return jsonify({"res":None, "msg":"Server Get Tags Error!"})    
    else:
        try:
            orm.updateEvent(eventId, data)
        except Exception as e:
            getTraceLog(e)
            return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    if tags != "":
        tags = json.loads(tags)
        tagids = [tag["id"] for tag in tags]
        try:
            orm.updateETs(eventId, tagids)
        except Exception as e:
            getTraceLog(e)
            return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":data, "msg":"Successfully get tags!"})


@app.route("/newTag")
def newTag():
    tagname = request.args.get("tagname")
    res = None;
    try:
        newtag = orm.createTag(tagname)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":{"id":newtag.id, "name":newtag.name}, "msg":"Successfully get tags!"})

@app.route("/deleteTag")
def deleteTag():
    tagid = request.args.get("tagid", type=int)
    res = None;
    try:
        res = orm.deleteTag(tagid)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route("/updateTag")
def updateTag():
    tagid = request.args.get("tagid", type=int)
    name = request.args.get("name")
    res = None;
    try:
        res = orm.updateTag(tagid, name)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

############

@app.route('/updateJson', methods=["POST"])
def updateJson():
    tagsdata = []
    if request.form.get('tags'):
        tagsdata = json.loads(request.form.get('tags'))
    entrydata = request.form.get('json')
    entryid = request.form.get('id', type=int)
    print("tagsdata = {}, entrydata = {}, entryid = {}".format(tagsdata, entrydata, entryid))
    res = {}
    # create entry
    # update entry
    try:
        if entryid == 0:
            entryid = orm.createEntry(json.loads(entrydata))
        else:
            orm.updateEntry(entryid, json.loads(entrydata))
    except ValueError as e:
        getTraceLog(e)
        res["res"] = False; res["msg"] = "Json update error, invalid json data!"
        return jsonify(res)
    except Exception as e:
        getTraceLog(e)
        res["res"] = False; res["msg"] = "Entry udpate/create error!"
        return jsonify(res)
    tagids, new_tags = processTags(tagsdata)
    new_tagids = []
    # create Tags
    if new_tags:
        try: 
            new_tagids = orm.createTags(new_tags)
        except Exception as e:
            getTraceLog(e)
            res["res"] = False; res["msg"] = "Create Tag Error!"
            return jsonify(res)
    # update ET
    if tagids+new_tagids:
        try: 
            orm.updateETs(entryid, tagids+new_tagids)
        except Exception as e:
            getTraceLog(e)
            res["res"] = False; res["msg"] = "Update EntryTags error!"
            return jsonify(res)
    res = {"res": True, "msg":"Successfully updated Entry id: {}!".format(entryid)}
    return jsonify(res)
'''
@app.route('/deleteEntry')
def deleteEntry():
    entryid = request.args.get("id", type=int)
    try:
        orm.deleteEntry(entryid)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":False, "msg":"Delete Entry Error!"})
    return jsonify({"res":True, "msg":"Successfully deleted entry: {}!".format(entryid)})

@app.route('/getTags')
def getTags():
    #tagid = request.args.get("tagid", type=int)
    res = None
    try:
        res = orm.getTags()
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route("/query", methods=["POST"])
def query():
    tagids = request.form.getlist('tags')
    content = request.form.get('content')
    print("tagids:{}".format(tagids))
    print("content:{}".format(content))
    try:
        querylist = orm.query(tagids, content)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res": False, "msg": "Query Content and Tag Error!"})
    return jsonify({"res":querylist, "msg":"Successfully Query Entries!"});
'''
if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=9300)