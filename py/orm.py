from peewee import *
from playhouse.shortcuts import model_to_dict
import datetime,json,copy
timeformat = "%Y/%m/%d %H:%M:%S"

db = SqliteDatabase('calendar.db')
db.pragma('foreign_keys', 1, permanent=True)
# db.connect()

class JSONField(TextField):
    def db_value(self, value):
        return json.dumps(value)

    def python_value(self, value):
        if value is not None:
            return json.loads(value)

class BaseModel(Model):
    class Meta:
        database = db

class Tag(BaseModel):
	name = CharField(unique=True)

class Event(BaseModel):
	# tag = ForeignKeyField(Tag, backref='event', null=True)
	# json = JSONField(default=[])
	title =  CharField()
	start =  CharField(null=True)
	end = CharField(null=True)
	desc = TextField(null=True)
	location = CharField(null=True)
	# recurring
	startTime = CharField(null=True)
	endTime = CharField(null=True)
	startRecur = CharField(null=True)
	endRecur = CharField(null=True)
	daysOfWeek = CharField(null=True)
	groupId = CharField(null=True, default="")
	allDay = BooleanField(default=False)
	recur = BooleanField(default=False)
	eventClass = JSONField(default={"non_recur":"", "recur":{}})

class EventTag(BaseModel):
	event = ForeignKeyField(Event, backref='ets', on_delete='CASCADE')
	tag = ForeignKeyField(Tag, backref='ets', on_delete='CASCADE')


#'''
# print(b.content[1])
# '''

# Tags
def createTag(name):
	newtag = Tag.create(name=name)
	return newtag

def createTags(names):
	ids = [createTag(name) for name in names]
	return ids

def getTags():
	res = []
	query = Tag.select()
	for tag in query:
		res.append({"id": tag.id, "name":tag.name})
	return {"results":res}

def deleteTag(id):
	num = Tag.delete().where(Tag.id == id).execute()
	return num

def updateTag(tagid, name):
	num = Tag.update(name=name).where(Tag.id == tagid).execute()
	return num

# Event
def dowTostr(obj):
	if "daysOfWeek" in obj:
		if obj["daysOfWeek"] not in[[],"", None]: 
			obj["daysOfWeek"] = json.dumps(obj["daysOfWeek"])
		else:
			obj["daysOfWeek"] = "[]";
	return obj

def dowToList(obj):
	if "daysOfWeek" in obj:
		if obj["daysOfWeek"] not in["", None, "[]"]: 
			obj["daysOfWeek"] = json.loads(obj["daysOfWeek"])
		else:
			del obj["daysOfWeek"]
	return obj

def createEvent(obj):
	obj = dowTostr(obj)
	new_id = Event.create(**obj)
	return new_id

def deleteEvent(id):
	num = Event.delete().where(Event.id == id).execute()
	return num

def updateEvent(id, obj):
	obj = dowTostr(obj)
	deleteExtraFields(obj)
	event_old = model_to_dict(Event.get(Event.id == id))
	num = Event.update(**obj).where(Event.id == id).execute()
	event_new = model_to_dict(Event.get(Event.id == id))
	if event_new["recur"] and detectChange(event_old, event_new, ["startTime", "endTime", "startRecur", "endRecur"]):
		rmAllClass(id)
	return num

def detectChange(event_old,event_new, fields):
	res = False
	for field in fields:
		if event_old[field] != event_new[field]:
			return True
	return False

def deleteExtraFields(obj):
	fields = Event._meta.fields.keys()
	for key in copy.copy(obj):
		if key not in fields:
			del obj[key]
	return obj

# Event class
def addClassText(eventClass, name):
	if name in eventClass.split(" "):
		return eventClass
	return (eventClass + " " + name).strip()

def rmClassText(eventClass, name):
	if name not in eventClass.split(" "):
		return eventClass
	a = eventClass.split(" ")
	a.remove(name)
	return " ".join(a)

def addClass(id, classname, start):
	event = Event.get(Event.id == id)
	ec = event.eventClass
	if not event.recur:
		ec["non_recur"] = addClassText(ec["non_recur"], classname)
	else:
		if start not in ec["recur"]:
			ec["recur"][start] = classname
		else:
			ec["recur"][start] = addClassText(ec["recur"][start], classname)
	Event.update({Event.eventClass:ec}).where(Event.id == id).execute()

def rmClass(id, classname, start):
	event = Event.get(Event.id == id)
	ec = event.eventClass
	if not event.recur:
		ec["non_recur"] = rmClassText(ec["non_recur"], classname)
	else:
		if start in ec["recur"]:
			ec["recur"][start] = rmClassText(ec["recur"][start], classname)
			if ec["recur"][start].strip() == "":
				del ec["recur"][start]
	Event.update({Event.eventClass:ec}).where(Event.id == id).execute()

def rmAllClass(id):
	ec = {"non_recur":"", "recur":{}}
	Event.update({Event.eventClass:ec}).where(Event.id == id).execute()

# EventTag
def createETs(eventid, tagids):
	res = []
	event = Event.get(Event.id == eventid)
	for id in tagids:
		tag = Tag.get(Tag.id == id)
		res.append(EventTag.create(event=event, tag=tag))
	return res

def deleteETs(eventid, tagids):
	res = 0
	event = Event.get(Event.id == eventid)
	for id in tagids:
		tag = Tag.get(Tag.id == id)
		res += EventTag.delete().where(EventTag.event==event, EventTag.tag==tag).execute()
	return res

def updateETs(eventid, tagids):
	print(eventid, tagids)
	res = getTagByEvent(eventid)
	cur_tagids = [each["id"] for each in res]
	for id in copy.copy(tagids):
		if id in cur_tagids:
			tagids.remove(id)
			cur_tagids.remove(id)
	# remove current
	deleteETs(eventid, cur_tagids)
	# add new
	createETs(eventid, tagids) 

def getTagByEvent(eventid):
	res = []
	query = Tag.select(Tag.id,Tag.name).join(EventTag).join(Event).where(Event.id==eventid).execute()
	for tag in query:
		res.append({"id": tag.id, "name":tag.name})
	return res

def getEventsByTags(tagids):
	res = []
	if "0" in tagids or 0 in tagids: # non-taged events
		query0 = Event.select().join(EventTag, JOIN.LEFT_OUTER).where(EventTag.id.is_null(True)).execute()
		res += queryToDict(query0)
	query = Event.select().join(EventTag).join(Tag).where(Tag.id.in_(tagids)).execute()
	res += queryToDict(query)
	return res

def queryToDict(query):
	res = []
	for event in query:
		event_dict = eventToDict(event)
		res.append(event_dict)
	return res

def eventToDict(event):
	event_dict = model_to_dict(event)
	event_dict = dowToList(event_dict)
	tags = getTagByEvent(event.id)
	event_dict['tags'] = tags
	return event_dict


if __name__ == "__main__":
	
	# print(createTag("Created Tag3!"))
	db.create_tables([Tag, Event, EventTag])
	'''

	a = Tag.create(name='My first tag')
	b = Event.create(json=[["nihao", "hello"], "world"])
	c = EventTag.create(event=b, tag=a)
	Tag.create(name='tag2')
	Tag.create(name='tag3')
	updateETs(1,[2,3])
	print(getTags())
	print(deleteTag(3))
	# updateETs(1,[2,3])
		'''
	# print(getTagByEvent(2))
	#print(getEventByTags([1,2]))
	# print(getTags())

	# print(query([1,2], "earth"))
	print(Event._meta.fields.keys())
	keys = Event._meta.fields.keys()
	for each in keys:
		print(each)