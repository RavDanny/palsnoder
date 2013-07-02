print(input["_id"])
files <- input[["files"]]
print(files[[1]]$type)
png(filename="averageWindow.png")
cars <- c(1, 3, 6, 4, 9)
plot(cars)
dev.off()
output = list(files=list(list(type="NEEAverageWindow",filename="averageWindow.png",mimetype="image/png")))
print(output[["files"]][[1]]$type)