#!/bin/bash
#

# Splits inputFile into two files: outputFile1 & outputFile2

# $1 inputFile: The file name of the source audio, with extension.
# $2 fragFile: The fragment to be inserted
# $3 outputFile: The filename for the audio before the split position.
# $4 position: The position at which the source file should be split.

# copy the first part to split1 and second to split2
ffmpeg -i "/data/$1" -acodec copy -t $4 -ss 00:00:00 "/data/split1.flac"

ffmpeg -i "/data/$1" -acodec copy -ss $4 "/data/split2.flac"

# create concatlist:  split1 + fragFile + split2
echo -e "file /data/split1.flac\nfile /data/$2\nfile /data/split2.flac" > "/data/concatlist.txt"

# merge together
ffmpeg -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/$3"



# mark this task complete
touch "/data/taskcomplete.marker"
