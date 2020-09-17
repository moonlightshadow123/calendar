from flask import Flask, jsonify, request, send_from_directory
from utils import addPath, getTraceLog
import orm, json

app = Flask(__name__, static_url_path='', static_folder="../web")   

# Tags
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

@app.route("/newTag")
def newTag():
    tagname = request.args.get("tagname")
    res = None;
    try:
        newtag = orm.createTag(tagname)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Create Tag Error!"})
    return jsonify({"res":{"id":newtag.id, "name":newtag.name}, "msg":"Successfully Created Tag!"})

@app.route("/deleteTag")
def deleteTag():
    tagid = request.args.get("tagid", type=int)
    res = None;
    try:
        res = orm.deleteTag(tagid)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Delete Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully Ddelete Tag!"})

@app.route("/updateTag")
def updateTag():
    tagid = request.args.get("tagid", type=int)
    name = request.args.get("name")
    res = None;
    try:
        res = orm.updateTag(tagid, name)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Update Tag Error!"})
    return jsonify({"res":res, "msg":"Successfully Update tag!"})

# Events
@app.route('/getEventsByTags',methods=["POST"])
def getEventsByTags():
    tagsdata = request.get_json()
    print(tagsdata)
    try:
        res = orm.getEventsByTags(tagsdata)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Events By Tag Error!"})
    return jsonify({"res":res, "msg":"Successfully Get Events By Tag!"})

@app.route("/deleteEvent")
def deleteEvent():
    eventId = request.args.get("id")
    res = None;
    try:
        res = orm.deleteEvent(eventId)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Delete Event Error!"})
    return jsonify({"res":res, "msg":"Successfully Delete Event!"})

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
            return jsonify({"res":None, "msg":"Server Create Event Error!"})    
    else:
        try:
            orm.updateEvent(eventId, data)
        except Exception as e:
            getTraceLog(e)
            return jsonify({"res":None, "msg":"Server Update Event Error!"})
    if tags != "":
        tags = json.loads(tags)
        tagids = [tag["id"] for tag in tags]
        try:
            orm.updateETs(eventId, tagids)
        except Exception as e:
            getTraceLog(e)
            return jsonify({"res":None, "msg":"Server Update EventTag Error!"})
    return jsonify({"res":data, "msg":"Successfully Update Event!"})

# Event class
@app.route('/addClass')
def addClass():
    id = request.args.get("id")
    name = request.args.get("class")
    start = request.args.get("start")
    try:
        res = orm.addClass(id, name, start)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Add Class Error!"})
    return jsonify({"res":"success", "msg":"Successfully Add Class!"})

@app.route('/rmClass')
def rmClass():
    id = request.args.get("id")
    name = request.args.get("class")
    start = request.args.get("start")
    try:
        res = orm.rmClass(id, name, start)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Remove Class Error!"})
    return jsonify({"res":"success", "msg":"Successfully Remove Class!"})


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=9300)