    1     cat << EOF > create_cors_json.py
    2     import json
    3 
    4     cors_config = [
    5         {
    6             "origin": ["*"],
    7             "method": ["GET", "PUT", "POST"],
    8             "responseHeader": ["*"],
    9             "maxAgeSeconds": 3600
   10         }
   11     ]
   12 
   13     with open("cors-config.json", "w") as f:
   14         json.dump(cors_config, f, indent=2)
   15 
   16     print("cors-config.json created successfully.")
   17     EOF