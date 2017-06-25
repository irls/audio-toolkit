#!/bin/bash
#

# Delete section. Split, split then merge

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio before the split position.
# $3 fromPos: The position at which the source file should be split.
# $4 toPos: The position at which the source file should be split.

# copy the first part to split1 and second to split2
ffmpeg -i "/data/$1" -acodec copy -t $3 -ss 00:00:00 "/data/split1.flac"
ffmpeg -i "/data/$1" -acodec copy -ss $4 "/data/split2.flac"

# create concatlist:  split1 + split2
echo -e "file /data/split1.flac\nfile /data/split2.flac" > "/data/concatlist.txt"

# merge together
ffmpeg -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/$2"



# mark this task complete
touch "/data/taskcomplete.marker"
