import requests
url = "https://store.steampowered.com/tagdata/populartags/english"
a = requests.get(url)
w = a.json()

options = []
for i in w:
    options.append({"value":i["name"].lower().replace(" ","_"), "label":i["name"]})
mapper = {}
for i in w:
    mapper[i["name"].lower().replace(" ","_")] = str(i["tagid"])
import json

with open("steam_tags_options.json", "w") as f:
    json.dump(options, f,  indent = 4)
with open("steam_tags_ids.json", "w") as f:
    json.dump(mapper, f,  indent = 4)
