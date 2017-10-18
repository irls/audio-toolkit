#!/bin/bash
#
# Generates file with silence in specified position in "/data/" folder
# $1 (length): the length of necessary silence
# $2 (inputFile): the source file where silence should be inserted
# $3 (position): position in seconds where silence should be inserted
# $4 (destFile): the result with silence file name
# $5 (append): if necessary to append silence to the end

ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -ab 383k -t $1 "/data/silence.wav"
if [ "$3" = "0" ]
then
  ffmpeg -i "/data/$2" "/data/split1.wav"
  echo -e "file /data/silence.wav\nfile /data/split1.wav" > "/data/concatlist.txt"
elif [ "$5" = "1" ]
then
  ffmpeg -i "/data/$2" "/data/split1.wav"
  echo -e "file /data/split1.wav\nfile /data/silence.wav" > "/data/concatlist.txt"
else
  ffmpeg -ss 0 -i "/data/$2" -t $3 "/data/split1.wav"
  ffmpeg -ss $3 -i "/data/$2" "/data/split2.wav"
  echo -e "file /data/split1.wav\nfile /data/silence.wav\nfile /data/split2.wav" > "/data/concatlist.txt"
fi
ffmpeg -f concat -safe 0 -i "/data/concatlist.txt" -c copy "/data/target.wav"
ffmpeg -i "/data/target.wav" "/data/$4"

# mark this task complete
touch "/data/taskcomplete.marker"
