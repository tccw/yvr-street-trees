import json


def loadjson(filename: str) -> {}:
    with open(filename) as file:
        data = json.load(file)
    
    return data

def savejson(filename: str, data):
    with open(filename, 'w') as file:
        json.dump(data, file)