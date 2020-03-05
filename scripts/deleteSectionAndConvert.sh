#!/bin/bash
#

# Delete section. Split, split then merge

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio before the split position.
# $3 fromPos: The position at which the source file should be split.
# $4 toPos: The position at which the source file should be split.
# $5 outputInfo: Get result meta or not.

ext="${1##*.}"
extTarget="${2##*.}"

# copy the first part to split1 and second to split2
ffmpeg -hide_banner -i "/data/$1" -af atrim=start=0:end=$3 "/data/split1.$ext"
ffmpeg -hide_banner -i "/data/$1" -af atrim=start=$4 "/data/split2.$ext"

# create concatlist:  split1 + split2
echo -e "file /data/split1.$ext\nfile /data/split2.$ext" > "/data/concatlist.txt"

# merge together
if [[ "$ext" != "$extTarget" ]]
then
ffmpeg -hide_banner -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/$2.$ext"
echo "ffmpeg -hide_banner -f concat -safe 0 -i /data/concatlist.txt -c copy /data/$2.$ext"
else
ffmpeg -hide_banner -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/$2"
echo "ffmpeg -hide_banner -f concat -safe 0 -i /data/concatlist.txt -c copy /data/$2"
fi
if [[ $5 ]]
then
ffmpeg -hide_banner -i "/data/$2.$ext" 2>&1 | grep "Duration" > "/data/out_data"
fi
if [[ "$ext" != "$extTarget" ]]
then
ffmpeg -hide_banner -i "/data/$2.$ext" -ar 44100 "/data/$2.$extTarget";
mv "/data/$2.$extTarget" "/data/$2"
fi


# mark this task complete
touch "/data/taskcomplete.marker"

