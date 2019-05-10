#!/bin/bash
#
# Generates file with silence in specified position in "/data/" folder
# $1 (length): the length of necessary silence
# $2 (inputFile): the source file where silence should be inserted
# $3 (position): position in seconds where silence should be inserted
# $4 (destFile): the result with silence file name
# $5 (append): if necessary to append silence to the end

ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -t $1 "/data/silence.wav"
if [ "$3" = "0" ]
then
  ffmpeg -i "/data/$2" "/data/split1.wav"
  ffmpeg -i "/data/silence.wav" -i "/data/split1.wav" -filter_complex '[0:0][1:0]concat=n=2:v=0:a=1[out]' -map '[out]' "/data/target.wav"
elif [ "$5" = "1" ]
then
  ffmpeg -i "/data/$2" "/data/split1.wav"
  ffmpeg -i "/data/split1.wav" -i "/data/silence.wav" -filter_complex '[0:0][1:0]concat=n=2:v=0:a=1[out]' -map '[out]' "/data/target.wav"
else
  ffmpeg -ss 0 -i "/data/$2" -t $3 "/data/split1.wav"
  ffmpeg -ss $3 -i "/data/$2" "/data/split2.wav"
  ffmpeg -i "/data/split1.wav" -i "/data/silence.wav" -i "/data/split2.wav" -filter_complex '[0:0][1:0][2:0]concat=n=3:v=0:a=1[out]' -map '[out]' "/data/target.wav"
fi
ffmpeg -i "/data/target.wav" "/data/$4"

# mark this task complete
touch "/data/taskcomplete.marker"
