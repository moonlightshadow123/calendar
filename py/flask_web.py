from flask import Flask, jsonify, request, send_from_directory
from utils import addPath, getTraceLog
import orm, json

app = Flask(__name__, static_url_path='', static_folder="../web")   

def processTags(tagsdata):
    tagids = []
    new_tags = []
    for tag in tagsdata:
        if "id" in tag:
            tagids.append(tag['id'])
        else:
            new_tags.append(tag['value'])
    return tagids, new_tags

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
    res = None;
    try:
        res = orm.getTags()
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":None, "msg":"Server Get Tags Error!"})
    return jsonify({"res":res, "msg":"Successfully get tags!"})

@app.route('/deleteTag')
def deleteTag():
    tagid = request.args.get("tagid", type=int)
    try:
        orm.deleteTag(tagid)
    except Exception as e:
        getTraceLog(e)
        return jsonify({"res":False, "msg":"Delete Tag Error!"})
    return jsonify({"res":True, "msg":"Successfully deleted tag: {}!".format(tagid)})

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

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=9200)