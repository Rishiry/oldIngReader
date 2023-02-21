API = "https://europe-west1-addicheck-tcd.cloudfunctions.net/procesImage"

# import requests library
import requests

# import base64 library
import base64

# send image to API as base 64 encoded string
with open("test.jpeg", "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read())

# send image to API
r = requests.post(url = API, data = {'image': encoded_string, 'imageType': "png"})





# print response
print(r.text)
