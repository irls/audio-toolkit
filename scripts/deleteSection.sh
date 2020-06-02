#!/bin/bash
#

# Delete section. Split, split then merge

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio before the split position.
# $3 fromPos: The position at which the source file should be split.
# $4 toPos: The position at which the source file should be split.
# $5 outputInfo: Get result meta or not.

ext="${1##*.}"

# copy the first part to split1 and second to split2
# ffmpeg -i "/data/$1" -acodec copy -t $3 -ss 00:00:00 "/data/split1.$ext"
# ffmpeg -i "/data/$1" -acodec copy -ss $4 "/data/split2.$ext"
ffmpeg -hide_banner -i "/data/$1" -af atrim=start=0:end=$3 "/data/split1.$ext"
ffmpeg -hide_banner -i "/data/$1" -af atrim=start=$4 "/data/split2.$ext"

# create concatlist:  split1 + split2
echo -e "file /data/split1.$ext\nfile /data/split2.$ext" > "/data/concatlist.txt"

# merge together
ffmpeg -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/$2"

if [[ $5 ]]
then
ffmpeg -hide_banner -i "/data/$1" 2>&1 | grep "Duration" > "/data/in_data"
ffmpeg -hide_banner -i "/data/$2" 2>&1 | grep "Duration" > "/data/out_data"
fi



# mark this task complete
touch "/data/taskcomplete.marker"
