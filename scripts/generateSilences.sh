#!/bin/bash

# Generate files with silence

# $1 start value
# $2 step
# $3 end value
# $4 format

LANG=en_US
#it should be en_US.UTF-8
LC_NUMERIC=de_DE.UTF-8

for i in `seq $1 $2 $3`;
do 
    ffmpeg -hide_banner -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -t $i "/data/$i.$4"
done