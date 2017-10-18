#!/bin/bash
#
# Generates file with silence in specified position in "/data/" folder
# $1 (length): the length of necessary silence
# $2 (inputFile): the source file where silence should be inserted
# $3 (position): position in seconds where silence should be inserted
# $4 (destFile): the result with silence file name

ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -ab 383k -t $1 "/data/silence.wav"
ffmpeg -ss 0 -i "/data/$2" -t $3 "/data/split1.wav"
ffmpeg -ss $3 -i "/data/$2" "/data/split2.wav"
echo -e "file /data/split1.wav\nfile /data/silence.wav\nfile /data/split2.wav" > "/data/concatlist.txt"
ffmpeg -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/target.wav"
ffmpeg -i "/data/target.wav" "/data/$4"

# mark this task complete
touch "/data/taskcomplete.marker"
