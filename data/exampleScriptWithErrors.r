print(input["_id"])
files <- input[["files"]]
print(files[[1]]$type)
output = list(files=list(list(type="NEEAverageWindow",filename="averageWindow.png",mimetype="image/png",error="Did not work")),error="Global Error")
print(output[["files"]][[1]]$type)